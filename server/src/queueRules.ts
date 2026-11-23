import type Database from "better-sqlite3";

export type QueueStatus = "Waiting" | "Called" | "In chair" | "Done" | "Cancelled" | "No-show";

export class QueueRuleError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
  ) {
    super(message);
  }
}

export function normalizePhone(phone: unknown): string {
  if (typeof phone !== "string") return "";
  return phone.replace(/\D/g, "");
}

export function kolkataDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function kolkataMinutes(date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return Number(values.hour) * 60 + Number(values.minute);
}

export function getClosingInfo(db: Database.Database) {
  const manual = db.prepare("SELECT value FROM salon_settings WHERE setting_key = 'is_open'").get() as { value: string } | undefined;
  const closing = db.prepare("SELECT value FROM salon_settings WHERE setting_key = 'closing_time'").get() as { value: string } | undefined;
  const [hour, minute] = (closing?.value || "21:00").split(":").map(Number);
  const closingMinutes = hour * 60 + minute;
  const isManuallyOpen = manual?.value !== "0";
  const beforeCutoff = kolkataMinutes() < closingMinutes - 30;
  return {
    isManuallyOpen,
    beforeCutoff,
    joinEnabled: isManuallyOpen && beforeCutoff,
  };
}

export function hasAvailableBarber(db: Database.Database): boolean {
  return ((db.prepare(`
    SELECT COUNT(*) AS count FROM barbers WHERE on_duty = 1 AND on_break = 0
  `).get() as { count: number }).count > 0);
}

export function getServices(db: Database.Database) {
  return (db.prepare(`
    SELECT id, name_en AS nameEn, name_gu AS nameGu, minutes, price, enabled
    FROM services ORDER BY id
  `).all() as Array<{ id: number; nameEn: string; nameGu: string; minutes: number; price: number; enabled: number }>).map((service) => ({
    ...service,
    enabled: Boolean(service.enabled),
  }));
}

export function validateJoinInput(db: Database.Database, input: {
  name?: unknown;
  phone?: unknown;
  serviceIds?: unknown;
  preferredBarberId?: unknown;
  walkIn?: boolean;
}) {
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    throw new QueueRuleError("Name is required");
  }
  const phone = normalizePhone(input.phone);
  if (!/^\d{10}$/.test(phone)) {
    throw new QueueRuleError("Phone must contain exactly 10 digits");
  }
  if (!Array.isArray(input.serviceIds) || input.serviceIds.length < 1 || input.serviceIds.length > 3) {
    throw new QueueRuleError("Select between 1 and 3 services");
  }
  if (new Set(input.serviceIds).size !== input.serviceIds.length) {
    throw new QueueRuleError("Duplicate services are not allowed");
  }
  if (!input.serviceIds.every((id) => Number.isInteger(id))) {
    throw new QueueRuleError("Invalid service selection");
  }
  const selected = input.serviceIds.map((id) => db.prepare(`
    SELECT id, name_en AS nameEn, name_gu AS nameGu, minutes, price, enabled
    FROM services WHERE id = ?
  `).get(id as number) as { id: number; nameEn: string; nameGu: string; minutes: number; price: number; enabled: number } | undefined);
  if (selected.some((service) => !service)) throw new QueueRuleError("A selected service does not exist");
  if (selected.some((service) => !service?.enabled)) throw new QueueRuleError("A selected service is disabled");

  let preferredBarberId: number | null = null;
  if (input.preferredBarberId !== null && input.preferredBarberId !== undefined && input.preferredBarberId !== "") {
    preferredBarberId = Number(input.preferredBarberId);
    if (!Number.isInteger(preferredBarberId)) throw new QueueRuleError("Invalid barber selection");
    const barber = db.prepare("SELECT id, name, on_duty, on_break FROM barbers WHERE id = ?").get(preferredBarberId) as
      | { id: number; name: string; on_duty: number; on_break: number }
      | undefined;
    if (!barber) throw new QueueRuleError("Selected barber does not exist");
    if (!barber.on_duty) throw new QueueRuleError("Selected barber is not on duty");
    if (barber.on_break) throw new QueueRuleError(`${barber.name} is on break`);
  }
  const closing = getClosingInfo(db);
  if (!input.walkIn && !closing.joinEnabled) throw new QueueRuleError("The queue is closed for online joining");
  if (!input.walkIn && !hasAvailableBarber(db)) throw new QueueRuleError("No barber is available");

  return {
    name: input.name.trim(),
    phone,
    preferredBarberId,
    selectedServices: selected as Array<{ id: number; nameEn: string; nameGu: string; minutes: number; price: number; enabled: number }>,
  };
}

export function calculateWait(db: Database.Database, serviceMinutes: number, preferredBarberId: number | null, entryId?: number): number | null {
  const available = db.prepare(`
    SELECT COUNT(*) AS count FROM barbers WHERE on_duty = 1 AND on_break = 0
  `).get() as { count: number };
  if (available.count === 0) return null;

  let workAhead = 0;
  if (preferredBarberId) {
    workAhead = (db.prepare(`
      SELECT COALESCE(SUM(s.minutes), 0) AS minutes
      FROM queue_entries q
      JOIN queue_entry_services qes ON qes.queue_entry_id = q.id
      JOIN services s ON s.id = qes.service_id
      WHERE q.status IN ('Waiting', 'Called')
        AND (q.preferred_barber_id = ? OR q.preferred_barber_id IS NULL)
        AND (? IS NULL OR q.id != ?)
    `).get(preferredBarberId, entryId ?? null, entryId ?? null) as { minutes: number }).minutes;
  } else {
    workAhead = (db.prepare(`
      SELECT COALESCE(SUM(s.minutes), 0) AS minutes
      FROM queue_entries q
      JOIN queue_entry_services qes ON qes.queue_entry_id = q.id
      JOIN services s ON s.id = qes.service_id
      WHERE q.status = 'Waiting'
        AND (? IS NULL OR q.id != ?)
    `).get(entryId ?? null, entryId ?? null) as { minutes: number }).minutes;
  }
  return Math.ceil((workAhead + serviceMinutes) / available.count);
}

export function issueToken(db: Database.Database): string {
  const today = kolkataDate();
  const dateRow = db.prepare("SELECT value FROM salon_settings WHERE setting_key = 'token_date'").get() as { value: string } | undefined;
  const sequenceRow = db.prepare("SELECT value FROM salon_settings WHERE setting_key = 'token_sequence'").get() as { value: string } | undefined;
  let sequence = dateRow?.value === today ? Number(sequenceRow?.value || 0) : 0;
  sequence += 1;
  db.prepare("INSERT OR REPLACE INTO salon_settings (setting_key, value) VALUES ('token_date', ?)").run(today);
  db.prepare("INSERT OR REPLACE INTO salon_settings (setting_key, value) VALUES ('token_sequence', ?)").run(String(sequence));
  return `S-${sequence}`;
}

export function findActiveSpot(db: Database.Database, phone: string) {
  return db.prepare(`
    SELECT * FROM queue_entries
    WHERE phone = ? AND status IN ('Waiting', 'Called', 'In chair')
    ORDER BY id DESC LIMIT 1
  `).get(phone) as { id: number } | undefined;
}

export function getCanonicalStatus(db: Database.Database, id: number) {
  const entry = db.prepare(`
    SELECT q.*, preferred.name AS preferred_barber_name,
      assigned.name AS assigned_barber_name
    FROM queue_entries q
    LEFT JOIN barbers preferred ON preferred.id = q.preferred_barber_id
    LEFT JOIN barbers assigned ON assigned.id = q.assigned_barber_id
    WHERE q.id = ?
  `).get(id) as {
    id: number; token: string; customer_name: string; phone: string;
    preferred_barber_id: number | null; preferred_barber_name: string | null;
    assigned_barber_name: string | null;
    status: QueueStatus; joined_at: string;
  } | undefined;
  if (!entry) return null;

  const services = db.prepare(`
    SELECT s.id, s.name_en AS nameEn, s.name_gu AS nameGu, s.minutes, s.price
    FROM queue_entry_services qes JOIN services s ON s.id = qes.service_id
    WHERE qes.queue_entry_id = ? ORDER BY s.id
  `).all(entry.id) as Array<{ id: number; nameEn: string; nameGu: string; minutes: number; price: number }>;
  const waitingRows = db.prepare(`
    SELECT id FROM queue_entries WHERE status = 'Waiting' ORDER BY joined_at ASC, id ASC
  `).all() as Array<{ id: number }>;
  const waitingIndex = waitingRows.findIndex((row) => row.id === entry.id);
  const position = entry.status === "Waiting" ? waitingIndex + 1 : entry.status === "Called" ? 1 : null;
  const ownMinutes = services.reduce((sum, service) => sum + service.minutes, 0);
  const totalPrice = services.reduce((sum, service) => sum + service.price, 0);
  const waitMinutes = ["Waiting", "Called"].includes(entry.status)
    ? calculateWait(db, ownMinutes, entry.preferred_barber_id, entry.id)
    : null;

  return {
    id: entry.id,
    token: entry.token,
    name: entry.customer_name,
    phone: entry.phone,
    status: entry.status,
    position,
    waitMinutes,
    ownMinutes,
    totalPrice,
    preferredBarberId: entry.preferred_barber_id,
    preferredBarberName: entry.preferred_barber_name,
    assignedBarberName: entry.assigned_barber_name,
    services,
  };
}

export function assertAllowedTransition(
  currentStatus: QueueStatus,
  nextStatus: QueueStatus,
  allowedNext: QueueStatus[],
) {
  const actualAllowed = {
    Waiting: ["Called", "Cancelled"],
    Called: ["In chair", "No-show"],
    "In chair": ["Done"],
    Done: [],
    Cancelled: [],
    "No-show": [],
  } as Record<QueueStatus, QueueStatus[]>;
  if (!actualAllowed[currentStatus].includes(nextStatus) || !allowedNext.includes(nextStatus)) {
    const allowedText = actualAllowed[currentStatus].join(", ") || "none";
    throw new QueueRuleError(
      `Invalid transition from ${currentStatus} to ${nextStatus}; allowed next states: ${allowedText}`,
    );
  }
}

export function getStaffOverview(db: Database.Database) {
  const barbers = db.prepare(`
    SELECT b.id, b.name, b.on_duty AS onDuty, b.on_break AS onBreak, b.photo_url AS photoUrl,
      q.id AS currentEntryId, q.token AS currentToken,
      q.customer_name AS currentCustomer, q.started_at AS startedAt,
      (SELECT COALESCE(SUM(s.minutes), 0)
       FROM queue_entry_services qes JOIN services s ON s.id = qes.service_id
       WHERE qes.queue_entry_id = q.id) AS currentMinutes,
      (SELECT COUNT(*) FROM queue_entries n
       WHERE n.status = 'Called' AND n.assigned_barber_id = b.id) AS calledCount
    FROM barbers b
    LEFT JOIN queue_entries q
      ON q.status = 'In chair' AND q.assigned_barber_id = b.id
    ORDER BY b.id
  `).all() as Array<{
    id: number; name: string; onDuty: number; onBreak: number; photoUrl: string | null;
    currentEntryId: number | null; currentToken: string | null;
    currentCustomer: string | null; startedAt: string | null; calledCount: number;
    currentMinutes: number;
  }>;

  const waiting = db.prepare(`
    SELECT q.id, q.token, q.customer_name AS name, q.phone,
      q.preferred_barber_id AS preferredBarberId,
      b.name AS preferredBarberName, q.joined_at AS joinedAt, q.status,
      (SELECT COALESCE(SUM(s.minutes), 0)
       FROM queue_entry_services qes JOIN services s ON s.id = qes.service_id
       WHERE qes.queue_entry_id = q.id) AS totalMinutes
    FROM queue_entries q
    LEFT JOIN barbers b ON b.id = q.preferred_barber_id
    WHERE q.status = 'Waiting'
    ORDER BY q.joined_at ASC, q.id ASC
  `).all() as Array<{
    id: number; token: string; name: string; phone: string;
    preferredBarberId: number | null; preferredBarberName: string | null;
    joinedAt: string; status: QueueStatus; totalMinutes: number;
  }>;

  return {
    barbers: barbers.map((barber) => ({
      id: barber.id,
      name: barber.name,
      onDuty: Boolean(barber.onDuty),
      onBreak: Boolean(barber.onBreak),
      photoUrl: barber.photoUrl,
      currentEntryId: barber.currentEntryId,
      currentToken: barber.currentToken,
      currentCustomer: barber.currentCustomer,
      startedAt: barber.startedAt,
      currentMinutes: barber.currentMinutes,
      calledCount: barber.calledCount,
    })),
    waiting: waiting.map((entry) => ({
      ...entry,
      services: db.prepare(`
        SELECT s.name_en AS nameEn, s.name_gu AS nameGu, s.minutes, s.price
        FROM queue_entry_services qes JOIN services s ON s.id = qes.service_id
        WHERE qes.queue_entry_id = ? ORDER BY s.id
      `).all(entry.id),
    })),
    called: db.prepare(`
      SELECT q.id, q.token, q.customer_name AS name,
        q.assigned_barber_id AS barberId, b.name AS barberName, q.called_at AS calledAt
      FROM queue_entries q
      LEFT JOIN barbers b ON b.id = q.assigned_barber_id
      WHERE q.status = 'Called'
      ORDER BY q.called_at ASC, q.id ASC
    `).all(),
  };
}

export function callNextCustomer(db: Database.Database, barberId: number) {
  return db.transaction(() => {
    const barber = db.prepare("SELECT id, name, on_duty, on_break FROM barbers WHERE id = ?").get(barberId) as
      | { id: number; name: string; on_duty: number; on_break: number }
      | undefined;
    if (!barber) throw new QueueRuleError("Selected barber does not exist");
    if (!barber.on_duty) throw new QueueRuleError(`${barber.name} is not on duty`);
    if (barber.on_break) throw new QueueRuleError(`${barber.name} is on break`);

    const occupied = db.prepare(`
      SELECT id FROM queue_entries
      WHERE status = 'In chair' AND assigned_barber_id = ?
    `).get(barberId);
    if (occupied) throw new QueueRuleError(`${barber.name} already has one customer in chair`);

    const customer = db.prepare(`
      SELECT id, status FROM queue_entries
      WHERE status = 'Waiting'
        AND (preferred_barber_id = ? OR preferred_barber_id IS NULL)
      ORDER BY joined_at ASC, id ASC
      LIMIT 1
    `).get(barberId) as { id: number; status: QueueStatus } | undefined;
    if (!customer) throw new QueueRuleError(`No eligible waiting customer for ${barber.name}`);

    assertAllowedTransition(customer.status, "Called", ["Called"]);
    const calledAt = new Date().toISOString();
    db.prepare(`
      UPDATE queue_entries
      SET status = 'Called', assigned_barber_id = ?, called_at = ?
      WHERE id = ? AND status = 'Waiting'
    `).run(barberId, calledAt, customer.id);
    return getCanonicalStatus(db, customer.id);
  })();
}

export function startCustomer(db: Database.Database, barberId: number, entryId: number) {
  return db.transaction(() => {
    const entry = db.prepare("SELECT id, status, assigned_barber_id FROM queue_entries WHERE id = ?").get(entryId) as
      | { id: number; status: QueueStatus; assigned_barber_id: number | null }
      | undefined;
    if (!entry) throw new QueueRuleError("Customer not found", 404);
    assertAllowedTransition(entry.status, "In chair", ["In chair"]);
    if (entry.assigned_barber_id !== barberId) {
      throw new QueueRuleError("This customer was not called for this barber");
    }
    const occupied = db.prepare(`
      SELECT id FROM queue_entries
      WHERE status = 'In chair' AND assigned_barber_id = ? AND id != ?
    `).get(barberId, entryId);
    if (occupied) throw new QueueRuleError("This barber already has one customer in chair");

    db.prepare(`
      UPDATE queue_entries SET status = 'In chair', started_at = ?
      WHERE id = ? AND status = 'Called'
    `).run(new Date().toISOString(), entryId);
    return getCanonicalStatus(db, entryId);
  })();
}

export function finishCustomer(db: Database.Database, barberId: number, entryId: number) {
  return db.transaction(() => {
    const entry = db.prepare("SELECT id, status, assigned_barber_id FROM queue_entries WHERE id = ?").get(entryId) as
      | { id: number; status: QueueStatus; assigned_barber_id: number | null }
      | undefined;
    if (!entry) throw new QueueRuleError("Customer not found", 404);
    assertAllowedTransition(entry.status, "Done", ["Done"]);
    if (entry.assigned_barber_id !== barberId) {
      throw new QueueRuleError("This customer is not in this barber's chair");
    }
    db.prepare(`
      UPDATE queue_entries SET status = 'Done', finished_at = ?
      WHERE id = ? AND status = 'In chair'
    `).run(new Date().toISOString(), entryId);
    return getCanonicalStatus(db, entryId);
  })();
}

export function noShowCustomer(db: Database.Database, entryId: number, confirmedTenMinutes: boolean) {
  return db.transaction(() => {
    if (!confirmedTenMinutes) throw new QueueRuleError("Confirm that 10 minutes have elapsed");
    const entry = db.prepare("SELECT id, status, called_at FROM queue_entries WHERE id = ?").get(entryId) as
      | { id: number; status: QueueStatus; called_at: string | null }
      | undefined;
    if (!entry) throw new QueueRuleError("Customer not found", 404);
    assertAllowedTransition(entry.status, "No-show", ["No-show"]);
    if (!entry.called_at) throw new QueueRuleError("Called time is missing");
    const elapsedMinutes = (Date.now() - new Date(entry.called_at).getTime()) / 60_000;
    if (elapsedMinutes < 10) {
      throw new QueueRuleError(`No-show requires 10 minutes in Called state; elapsed ${Math.floor(elapsedMinutes)} minutes`);
    }
    db.prepare("UPDATE queue_entries SET status = 'No-show' WHERE id = ? AND status = 'Called'").run(entryId);
    return getCanonicalStatus(db, entryId);
  })();
}

export function receptionistCancel(db: Database.Database, entryId: number) {
  return db.transaction(() => {
    const entry = db.prepare("SELECT id, status FROM queue_entries WHERE id = ?").get(entryId) as
      | { id: number; status: QueueStatus }
      | undefined;
    if (!entry) throw new QueueRuleError("Customer not found", 404);
    assertAllowedTransition(entry.status, "Cancelled", ["Cancelled"]);
    db.prepare("UPDATE queue_entries SET status = 'Cancelled' WHERE id = ? AND status = 'Waiting'").run(entryId);
    return getCanonicalStatus(db, entryId);
  })();
}

export function setBarberAvailability(db: Database.Database, barberId: number, onBreak: boolean) {
  const barber = db.prepare("SELECT id, name, on_duty FROM barbers WHERE id = ?").get(barberId) as
    | { id: number; name: string; on_duty: number }
    | undefined;
  if (!barber) throw new QueueRuleError("Barber not found", 404);
  if (!barber.on_duty) throw new QueueRuleError("Cannot set break status for a barber who is off duty");
  db.prepare("UPDATE barbers SET on_break = ? WHERE id = ?").run(onBreak ? 1 : 0, barberId);
  return db.prepare("SELECT id, name, on_duty AS onDuty, on_break AS onBreak FROM barbers WHERE id = ?").get(barberId);
}
