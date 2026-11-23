import "dotenv/config";
import http from "node:http";
import express from "express";
import cors from "cors";
import { Server } from "socket.io";
import { db } from "./db.js";
import {
  QueueRuleError,
  calculateWait,
  findActiveSpot,
  getCanonicalStatus,
  getClosingInfo,
  getServices,
  hasAvailableBarber,
  issueToken,
  normalizePhone,
  validateJoinInput,
  getStaffOverview,
  callNextCustomer,
  startCustomer,
  finishCustomer,
  noShowCustomer,
  receptionistCancel,
  setBarberAvailability,
  type QueueStatus,
} from "./queueRules.js";

const app = express();
const server = http.createServer(app);
app.use(cors({ origin: "*" }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: "*" },
});

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    database: db.open ? "connected" : "disconnected",
  });
});

function sendQueueUpdate() {
  io.emit("queue:update");
}

function publicQueueSummary() {
  const closing = getClosingInfo(db);
  const availableBarbers = hasAvailableBarber(db);
  const waitingCount = (db.prepare(`
    SELECT COUNT(*) AS count FROM queue_entries WHERE status = 'Waiting'
  `).get() as { count: number }).count;
  const serviceMinutes = (db.prepare(`
    SELECT COALESCE(SUM(s.minutes), 0) AS minutes
    FROM queue_entries q
    JOIN queue_entry_services qes ON qes.queue_entry_id = q.id
    JOIN services s ON s.id = qes.service_id
    WHERE q.status = 'Waiting'
  `).get() as { minutes: number }).minutes;
  const workingBarberCount = (db.prepare(`
    SELECT COUNT(*) AS count FROM barbers WHERE on_duty = 1 AND on_break = 0
  `).get() as { count: number }).count;
  const estimatedWaitMinutes = waitingCount === 0
    ? 0
    : workingBarberCount === 0
    ? null
    : Math.ceil(serviceMinutes / workingBarberCount);

  const barbers = db.prepare(`
    SELECT b.id, b.name, b.on_duty, b.on_break,
      EXISTS(
        SELECT 1 FROM queue_entries q
        WHERE q.status IN ('Called', 'In chair') AND q.assigned_barber_id = b.id
      ) AS occupied
    FROM barbers b ORDER BY b.id
  `).all() as Array<{ id: number; name: string; on_duty: number; on_break: number; occupied: number }>;

  return {
    isOpen: closing.isManuallyOpen,
    joinEnabled: closing.joinEnabled && availableBarbers,
    joinMessage: !closing.isManuallyOpen
      ? "closed"
      : !closing.beforeCutoff
        ? "closingSoon"
        : !availableBarbers
          ? "closed"
          : null,
    waitingCount,
    estimatedWaitMinutes,
    barbers: barbers.map((barber) => ({
      id: barber.id,
      name: barber.name,
      status: barber.on_break
        ? "break"
        : !barber.on_duty
          ? "break"
          : barber.occupied
            ? "busy"
            : "free",
    })),
  };
}

app.get("/api/home", (_request, response) => {
  response.json(publicQueueSummary());
});

app.get("/api/public/queue-summary", (_request, response) => {
  response.json(publicQueueSummary());
});

app.get("/api/services", (_request, response) => {
  response.json(getServices(db));
});

app.get("/api/barbers", (_request, response) => {
  const barbers = db.prepare(`
    SELECT id, name, on_duty AS onDuty, on_break AS onBreak, photo_url AS photoUrl
    FROM barbers ORDER BY id
  `).all() as Array<{ id: number; name: string; onDuty: number; onBreak: number; photoUrl: string | null }>;
  response.json(barbers.map((barber) => ({
    ...barber,
    onDuty: Boolean(barber.onDuty),
    onBreak: Boolean(barber.onBreak),
  })));
});

app.post("/api/join/preview", (request, response) => {
  try {
    const serviceIds = Array.isArray(request.body?.serviceIds) ? request.body.serviceIds : [];
    if (serviceIds.length < 1 || serviceIds.length > 3) {
      throw new QueueRuleError("Select between 1 and 3 services");
    }
    if (new Set(serviceIds).size !== serviceIds.length) {
      throw new QueueRuleError("Duplicate services are not allowed");
    }
    type PreviewService = { id: number; nameEn: string; nameGu: string; minutes: number; price: number; enabled: number };
    const selected = (serviceIds as unknown[]).map((id: unknown) => db.prepare(`
      SELECT id, name_en AS nameEn, name_gu AS nameGu, minutes, price, enabled
      FROM services WHERE id = ?
    `).get(id) as PreviewService | undefined);
    if (selected.some((service: PreviewService | undefined) => !service)) throw new QueueRuleError("A selected service does not exist");
    if (selected.some((service: PreviewService | undefined) => !service?.enabled)) throw new QueueRuleError("A selected service is disabled");
    const preferredBarberId = request.body?.preferredBarberId == null || request.body.preferredBarberId === ""
      ? null
      : Number(request.body.preferredBarberId);
    let preferredBarberName: string | null = null;
    if (preferredBarberId !== null) {
      if (!Number.isInteger(preferredBarberId)) throw new QueueRuleError("Invalid barber selection");
      const barber = db.prepare("SELECT id, name, on_duty, on_break FROM barbers WHERE id = ?").get(preferredBarberId) as
        | { id: number; name: string; on_duty: number; on_break: number }
        | undefined;
      if (!barber) throw new QueueRuleError("Selected barber does not exist");
      if (!barber.on_duty) throw new QueueRuleError("Selected barber is not on duty");
      if (barber.on_break) throw new QueueRuleError(`${barber.name} is on break`);
      preferredBarberName = barber.name;
    }
    const totalMinutes = selected.reduce((sum: number, service: PreviewService | undefined) => sum + (service?.minutes || 0), 0);
    const totalPrice = selected.reduce((sum: number, service: PreviewService | undefined) => sum + (service?.price || 0), 0);
    response.json({
      totalMinutes,
      totalPrice,
      expectedWaitMinutes: calculateWait(db, totalMinutes, preferredBarberId),
      preferredBarberName,
    });
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Preview failed" });
  }
});

app.post("/api/join", (request, response) => {
  try {
    const validated = validateJoinInput(db, {
      name: request.body?.name,
      phone: request.body?.phone,
      serviceIds: request.body?.serviceIds,
      preferredBarberId: request.body?.preferredBarberId,
    });
    const join = db.transaction(() => {
      const existing = findActiveSpot(db, validated.phone);
      if (existing) {
        return getCanonicalStatus(db, existing.id);
      }
      const token = issueToken(db);
      const result = db.prepare(`
        INSERT INTO queue_entries
          (token, customer_name, phone, preferred_barber_id, status, is_walk_in, joined_at)
        VALUES (?, ?, ?, ?, 'Waiting', 0, ?)
      `).run(token, validated.name, validated.phone, validated.preferredBarberId, new Date().toISOString());
      const entryId = Number(result.lastInsertRowid);
      const insertService = db.prepare(`
        INSERT INTO queue_entry_services (queue_entry_id, service_id) VALUES (?, ?)
      `);
      for (const service of validated.selectedServices) insertService.run(entryId, service.id);
      return getCanonicalStatus(db, entryId);
    });
    const status = join();
    sendQueueUpdate();
    response.status(status ? 200 : 500).json(status);
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Join failed" });
  }
});

app.get("/api/status/:id", (request, response) => {
  const id = Number(request.params.id);
  if (!Number.isInteger(id)) {
    response.status(400).json({ error: "Invalid status id" });
    return;
  }
  const status = getCanonicalStatus(db, id);
  if (!status) {
    response.status(404).json({ error: "Spot not found" });
    return;
  }
  response.json(status);
});

app.post("/api/status/:id/cancel", (request, response) => {
  try {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) throw new QueueRuleError("Invalid status id");
    const entry = db.prepare("SELECT id, status FROM queue_entries WHERE id = ?").get(id) as
      | { id: number; status: string }
      | undefined;
    if (!entry) throw new QueueRuleError("Spot not found", 404);
    if (entry.status !== "Waiting") {
      throw new QueueRuleError(`Cannot cancel while status is ${entry.status}; only Waiting can be cancelled`);
    }
    db.prepare("UPDATE queue_entries SET status = 'Cancelled' WHERE id = ?").run(id);
    sendQueueUpdate();
    response.json(getCanonicalStatus(db, id));
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Cancellation failed" });
  }
});

const staffPin = process.env.STAFF_PIN || "1234";

function requireStaffPin(
  request: express.Request,
  response: express.Response,
  next: express.NextFunction,
) {
  if (request.get("x-staff-pin") !== staffPin) {
    response.status(401).json({ error: "Invalid staff PIN" });
    return;
  }
  next();
}

app.use("/api/staff", requireStaffPin);

app.get("/api/staff/overview", (_request, response) => {
  response.json(getStaffOverview(db));
});

app.post("/api/staff/walk-in", (request, response) => {
  try {
    const validated = validateJoinInput(db, {
      name: request.body?.name,
      phone: request.body?.phone,
      serviceIds: request.body?.serviceIds,
      preferredBarberId: request.body?.preferredBarberId,
      walkIn: true,
    });
    const status = db.transaction(() => {
      const existing = findActiveSpot(db, validated.phone);
      if (existing) return getCanonicalStatus(db, existing.id);
      const token = issueToken(db);
      const result = db.prepare(`
        INSERT INTO queue_entries
          (token, customer_name, phone, preferred_barber_id, status, is_walk_in, joined_at)
        VALUES (?, ?, ?, ?, 'Waiting', 1, ?)
      `).run(token, validated.name, validated.phone, validated.preferredBarberId, new Date().toISOString());
      const entryId = Number(result.lastInsertRowid);
      const insertService = db.prepare(`
        INSERT INTO queue_entry_services (queue_entry_id, service_id) VALUES (?, ?)
      `);
      for (const service of validated.selectedServices) insertService.run(entryId, service.id);
      return getCanonicalStatus(db, entryId);
    })();
    sendQueueUpdate();
    response.json(status);
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Walk-in failed" });
  }
});

app.post("/api/staff/re-add/:id", (request, response) => {
  try {
    const id = Number(request.params.id);
    const oldEntry = db.prepare(`
      SELECT id, status, customer_name, phone, preferred_barber_id
      FROM queue_entries WHERE id = ?
    `).get(id) as
      | { id: number; status: QueueStatus; customer_name: string; phone: string; preferred_barber_id: number | null }
      | undefined;
    if (!oldEntry) throw new QueueRuleError("Customer not found", 404);
    if (oldEntry.status !== "No-show") {
      throw new QueueRuleError(`Can only re-add a No-show spot; current status is ${oldEntry.status}`);
    }
    const serviceRows = db.prepare(`
      SELECT service_id FROM queue_entry_services WHERE queue_entry_id = ?
    `).all(id) as Array<{ service_id: number }>;
    if (serviceRows.length === 0) throw new QueueRuleError("No services found for re-add");
    const active = findActiveSpot(db, normalizePhone(oldEntry.phone));
    if (active) throw new QueueRuleError("This phone already has an active spot");

    const status = db.transaction(() => {
      const token = issueToken(db);
      const result = db.prepare(`
        INSERT INTO queue_entries
          (token, customer_name, phone, preferred_barber_id, status, is_walk_in, joined_at)
        VALUES (?, ?, ?, ?, 'Waiting', 1, ?)
      `).run(token, oldEntry.customer_name, oldEntry.phone, oldEntry.preferred_barber_id, new Date().toISOString());
      const newId = Number(result.lastInsertRowid);
      const insertService = db.prepare(`
        INSERT INTO queue_entry_services (queue_entry_id, service_id) VALUES (?, ?)
      `);
      for (const row of serviceRows) insertService.run(newId, row.service_id);
      return getCanonicalStatus(db, newId);
    })();
    sendQueueUpdate();
    response.json(status);
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Re-add failed" });
  }
});

app.post("/api/staff/barbers/:barberId/call", (request, response) => {
  try {
    const barberId = Number(request.params.barberId);
    const status = callNextCustomer(db, barberId);
    sendQueueUpdate();
    io.emit("queue:called", {
      id: status?.id,
      token: status?.token,
      barberName: status?.preferredBarberName,
    });
    response.json(status);
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Call failed" });
  }
});

app.post("/api/staff/barbers/:barberId/start/:entryId", (request, response) => {
  try {
    const status = startCustomer(db, Number(request.params.barberId), Number(request.params.entryId));
    sendQueueUpdate();
    response.json(status);
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Start failed" });
  }
});

app.post("/api/staff/barbers/:barberId/done/:entryId", (request, response) => {
  try {
    const status = finishCustomer(db, Number(request.params.barberId), Number(request.params.entryId));
    sendQueueUpdate();
    response.json(status);
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Done failed" });
  }
});

app.post("/api/staff/barbers/:barberId/availability", (request, response) => {
  try {
    const onBreak = Boolean(request.body?.onBreak);
    const barber = setBarberAvailability(db, Number(request.params.barberId), onBreak);
    sendQueueUpdate();
    response.json(barber);
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Availability update failed" });
  }
});

app.post("/api/staff/entries/:entryId/no-show", (request, response) => {
  try {
    const status = noShowCustomer(db, Number(request.params.entryId), Boolean(request.body?.confirmedTenMinutes));
    sendQueueUpdate();
    response.json(status);
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "No-show failed" });
  }
});

app.post("/api/staff/entries/:entryId/cancel", (_request, response) => {
  try {
    const status = receptionistCancel(db, Number(_request.params.entryId));
    sendQueueUpdate();
    response.json(status);
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Cancellation failed" });
  }
});

function validateServiceInput(body: unknown) {
  const input = body as {
    nameEn?: unknown;
    nameGu?: unknown;
    minutes?: unknown;
    price?: unknown;
  };
  if (typeof input.nameEn !== "string" || input.nameEn.trim().length === 0) {
    throw new QueueRuleError("English service name is required");
  }
  if (typeof input.nameGu !== "string" || input.nameGu.trim().length === 0) {
    throw new QueueRuleError("Gujarati service name is required");
  }
  const minutes = Number(input.minutes);
  const price = Number(input.price);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 480) {
    throw new QueueRuleError("Minutes must be a whole number between 1 and 480");
  }
  if (!Number.isInteger(price) || price < 0 || price > 100000) {
    throw new QueueRuleError("Price must be a whole number between 0 and 100000");
  }
  return {
    nameEn: input.nameEn.trim(),
    nameGu: input.nameGu.trim(),
    minutes,
    price,
  };
}

app.post("/api/staff/services", (request, response) => {
  try {
    const service = validateServiceInput(request.body);
    const result = db.prepare(`
      INSERT INTO services (name_en, name_gu, minutes, price, enabled)
      VALUES (?, ?, ?, ?, ?)
    `).run(service.nameEn, service.nameGu, service.minutes, service.price, request.body?.enabled === false ? 0 : 1);
    sendQueueUpdate();
    response.status(201).json(getServices(db).find((row) => row.id === Number(result.lastInsertRowid)));
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Create service failed" });
  }
});

app.put("/api/staff/services/:id", (request, response) => {
  try {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) throw new QueueRuleError("Invalid service id");
    const existing = db.prepare("SELECT id FROM services WHERE id = ?").get(id);
    if (!existing) throw new QueueRuleError("Service not found", 404);
    const service = validateServiceInput(request.body);
    const enabled = request.body?.enabled === undefined
      ? (db.prepare("SELECT enabled FROM services WHERE id = ?").get(id) as { enabled: number }).enabled
      : request.body.enabled === true ? 1 : 0;
    db.prepare(`
      UPDATE services
      SET name_en = ?, name_gu = ?, minutes = ?, price = ?, enabled = ?
      WHERE id = ?
    `).run(service.nameEn, service.nameGu, service.minutes, service.price, enabled, id);
    sendQueueUpdate();
    response.json(getServices(db).find((row) => row.id === id));
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Update service failed" });
  }
});

app.patch("/api/staff/services/:id/enabled", (request, response) => {
  try {
    const id = Number(request.params.id);
    if (!Number.isInteger(id)) throw new QueueRuleError("Invalid service id");
    if (typeof request.body?.enabled !== "boolean") {
      throw new QueueRuleError("enabled must be true or false");
    }
    const existing = db.prepare("SELECT id FROM services WHERE id = ?").get(id);
    if (!existing) throw new QueueRuleError("Service not found", 404);
    db.prepare("UPDATE services SET enabled = ? WHERE id = ?").run(request.body.enabled ? 1 : 0, id);
    sendQueueUpdate();
    response.json(getServices(db).find((row) => row.id === id));
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Update service failed" });
  }
});

app.patch("/api/staff/barbers/:barberId/duty", (request, response) => {
  try {
    const barberId = Number(request.params.barberId);
    if (typeof request.body?.onDuty !== "boolean") throw new QueueRuleError("onDuty must be true or false");
    const barber = db.prepare("SELECT id, name FROM barbers WHERE id = ?").get(barberId) as
      | { id: number; name: string }
      | undefined;
    if (!barber) throw new QueueRuleError("Barber not found", 404);
    db.prepare("UPDATE barbers SET on_duty = ?, on_break = CASE WHEN ? = 0 THEN 0 ELSE on_break END WHERE id = ?")
      .run(request.body.onDuty ? 1 : 0, request.body.onDuty ? 1 : 0, barberId);
    sendQueueUpdate();
    response.json(db.prepare(`
      SELECT id, name, on_duty AS onDuty, on_break AS onBreak
      FROM barbers WHERE id = ?
    `).get(barberId));
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Update duty failed" });
  }
});

app.patch("/api/staff/settings/open", (request, response) => {
  try {
    if (typeof request.body?.isOpen !== "boolean") {
      throw new QueueRuleError("isOpen must be true or false");
    }
    db.prepare(
      "INSERT OR REPLACE INTO salon_settings (setting_key, value) VALUES ('is_open', ?)",
    ).run(request.body.isOpen ? "1" : "0");
    sendQueueUpdate();
    response.json({ isOpen: request.body.isOpen });
  } catch (error) {
    const status = error instanceof QueueRuleError ? error.statusCode : 500;
    response.status(status).json({ error: error instanceof Error ? error.message : "Update open state failed" });
  }
});

app.get("/api/staff/admin", (_request, response) => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const opening = db.prepare("SELECT value FROM salon_settings WHERE setting_key = 'is_open'").get() as { value: string };
  const services = getServices(db);
  const barbers = db.prepare(`
    SELECT id, name, on_duty AS onDuty, on_break AS onBreak, photo_url AS photoUrl
    FROM barbers ORDER BY id
  `).all() as Array<{ id: number; name: string; onDuty: number; onBreak: number; photoUrl: string | null }>;

  const rows = db.prepare(`
    SELECT joined_at, called_at, finished_at, status
    FROM queue_entries
  `).all() as Array<{ joined_at: string; called_at: string | null; finished_at: string | null; status: QueueStatus }>;
  const istTodayRows = rows.filter((row) => {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date(row.joined_at));
    const date = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
    return `${date.year}-${date.month}-${date.day}` === today;
  });
  const served = istTodayRows.filter((row) => row.status === "Done").length;
  const noShows = istTodayRows.filter((row) => row.status === "No-show").length;
  const waits = istTodayRows
    .filter((row) => row.called_at)
    .map((row) => (new Date(row.called_at!).getTime() - new Date(row.joined_at).getTime()) / 60_000)
    .filter((minutes) => minutes >= 0);
  const averageWait = waits.length === 0
    ? 0
    : Math.round(waits.reduce((sum, minutes) => sum + minutes, 0) / waits.length);

  response.json({
    isOpen: opening?.value !== "0",
    services,
    barbers: barbers.map((barber) => ({
      ...barber,
      onDuty: Boolean(barber.onDuty),
      onBreak: Boolean(barber.onBreak),
    })),
    stats: {
      served,
      averageWait,
      noShows,
    },
  });
});

app.get("/api/display", (_request, response) => {
  const barbers = db.prepare(`
    SELECT b.id, b.name, b.photo_url AS photoUrl,
      q.id AS currentEntryId, q.token AS currentToken,
      q.customer_name AS currentCustomer
    FROM barbers b
    LEFT JOIN queue_entries q
      ON q.status = 'In chair' AND q.assigned_barber_id = b.id
    WHERE b.on_duty = 1
    ORDER BY b.id
  `).all() as Array<{
    id: number;
    name: string;
    photoUrl: string | null;
    currentEntryId: number | null;
    currentToken: string | null;
    currentCustomer: string | null;
  }>;

  const waiting = db.prepare(`
    SELECT q.id, q.token, q.joined_at AS joinedAt,
      COALESCE((
        SELECT SUM(s.minutes)
        FROM queue_entry_services qes JOIN services s ON s.id = qes.service_id
        WHERE qes.queue_entry_id = q.id
      ), 0) AS minutes
    FROM queue_entries q
    WHERE q.status = 'Waiting'
    ORDER BY q.joined_at ASC, q.id ASC
    LIMIT 5
  `).all() as Array<{ id: number; token: string; joinedAt: string; minutes: number }>;
  const availableCount = (db.prepare(`
    SELECT COUNT(*) AS count FROM barbers WHERE on_duty = 1 AND on_break = 0
  `).get() as { count: number }).count;

  let cumulative = 0;
  response.json({
    barbers,
    upNext: waiting.map((entry) => {
      cumulative += entry.minutes;
      return {
        token: entry.token,
        estimatedMinutes: availableCount === 0
          ? null
          : Math.ceil(cumulative / availableCount),
      };
    }),
  });
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => undefined);
});

const port = Number(process.env.PORT || 4000);

server.listen(port, "0.0.0.0", () => {
  console.log(`Server listening on http://localhost:${port}`);
});
