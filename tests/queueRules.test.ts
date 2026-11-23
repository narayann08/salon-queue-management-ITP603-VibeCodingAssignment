import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import {
  QueueRuleError,
  assertAllowedTransition,
  calculateWait,
  callNextCustomer,
  findActiveSpot,
  issueToken,
  normalizePhone,
  setBarberAvailability,
  validateJoinInput,
  startCustomer,
  finishCustomer,
  noShowCustomer,
  receptionistCancel,
  getCanonicalStatus,
} from "../server/src/queueRules.js";

function createDb() {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE barbers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      on_duty INTEGER NOT NULL DEFAULT 1,
      on_break INTEGER NOT NULL DEFAULT 0,
      photo_url TEXT
    );
    CREATE TABLE services (
      id INTEGER PRIMARY KEY,
      name_en TEXT NOT NULL,
      name_gu TEXT NOT NULL,
      minutes INTEGER NOT NULL,
      price INTEGER NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE queue_entries (
      id INTEGER PRIMARY KEY,
      token TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      preferred_barber_id INTEGER,
      assigned_barber_id INTEGER,
      status TEXT NOT NULL,
      is_walk_in INTEGER NOT NULL DEFAULT 0,
      joined_at TEXT NOT NULL,
      called_at TEXT,
      started_at TEXT,
      finished_at TEXT
    );
    CREATE TABLE queue_entry_services (
      queue_entry_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL
    );
    CREATE TABLE salon_settings (
      setting_key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  db.prepare("INSERT INTO barbers (id,name,on_duty,on_break) VALUES (1,'Ravi',1,0)").run();
  db.prepare("INSERT INTO barbers (id,name,on_duty,on_break) VALUES (2,'Amit',1,0)").run();
  db.prepare("INSERT INTO barbers (id,name,on_duty,on_break) VALUES (3,'Imran',1,0)").run();
  db.prepare("INSERT INTO services (id,name_en,name_gu,minutes,price,enabled) VALUES (1,'Haircut','હેરકટ',30,150,1)").run();
  db.prepare("INSERT INTO services (id,name_en,name_gu,minutes,price,enabled) VALUES (2,'Beard trim','દાઢી ટ્રિમ',15,80,1)").run();
  db.prepare("INSERT INTO services (id,name_en,name_gu,minutes,price,enabled) VALUES (3,'Hair spa','હેર સ્પા',45,400,1)").run();
  db.prepare("INSERT INTO services (id,name_en,name_gu,minutes,price,enabled) VALUES (4,'Hair colour','હેર કલર',60,650,1)").run();
  db.prepare("INSERT INTO salon_settings (setting_key,value) VALUES ('is_open','1')").run();
  db.prepare("INSERT INTO salon_settings (setting_key,value) VALUES ('closing_time','21:00')").run();
  return db;
}

test("1. normalizes phone formatting to exact 10 digits", () => {
  assert.equal(normalizePhone("+91 98765-43210"), "919876543210");
  assert.equal(normalizePhone("(987) 654-3210"), "9876543210");
  assert.equal(normalizePhone("9876543210"), "9876543210");
});

test("2. validates join input rejecting invalid phone length or service count", () => {
  const db = createDb();
  
  // Empty name
  assert.throws(() => validateJoinInput(db, { name: "", phone: "9876543210", serviceIds: [1] }), QueueRuleError);
  
  // Phone less than 10 digits
  assert.throws(() => validateJoinInput(db, { name: "Test", phone: "987654321", serviceIds: [1] }), QueueRuleError);
  
  // Phone more than 10 digits
  assert.throws(() => validateJoinInput(db, { name: "Test", phone: "919876543210", serviceIds: [1] }), QueueRuleError);
  
  // Zero services
  assert.throws(() => validateJoinInput(db, { name: "Test", phone: "9876543210", serviceIds: [] }), QueueRuleError);
  
  // More than 3 services
  assert.throws(() => validateJoinInput(db, { name: "Test", phone: "9876543210", serviceIds: [1, 2, 3, 4] }), QueueRuleError);
  
  // Duplicate services
  assert.throws(() => validateJoinInput(db, { name: "Test", phone: "9876543210", serviceIds: [1, 1] }), QueueRuleError);

  // Valid input succeeds (test with closing_time adjusted or walkIn: true)
  db.prepare("UPDATE salon_settings SET value = '23:59' WHERE setting_key = 'closing_time'").run();
  const valid = validateJoinInput(db, { name: "Raj", phone: "9876543210", serviceIds: [1, 2] });
  assert.equal(valid.name, "Raj");
  assert.equal(valid.phone, "9876543210");
  assert.equal(valid.selectedServices.length, 2);

  // Walk-in succeeds even if online joining is closed
  db.prepare("UPDATE salon_settings SET value = '12:00' WHERE setting_key = 'closing_time'").run();
  const validWalkIn = validateJoinInput(db, { name: "Kunal", phone: "9876543211", serviceIds: [1], walkIn: true });
  assert.equal(validWalkIn.name, "Kunal");
  db.close();
});

test("3. next-customer strictly respects Ravi preference and Any fallback", () => {
  const db = createDb();
  const insert = db.prepare(`
    INSERT INTO queue_entries
      (id,token,customer_name,phone,preferred_barber_id,assigned_barber_id,status,is_walk_in,joined_at)
    VALUES (?, ?, ?, ?, ?, NULL, 'Waiting', 1, ?)
  `);
  insert.run(1, "S-1", "Ravi customer", "9000000001", 1, "2026-01-01T09:00:00.000Z");
  insert.run(2, "S-2", "Any customer", "9000000002", null, "2026-01-01T09:01:00.000Z");

  // Amit calls: must skip customer 1 who preferred Ravi, and take customer 2
  const amitCall = callNextCustomer(db, 2);
  assert.equal(amitCall?.token, "S-2");
  assert.equal(amitCall?.preferredBarberId, null);

  // Ravi calls: picks customer 1 who requested Ravi
  const raviCall = callNextCustomer(db, 1);
  assert.equal(raviCall?.token, "S-1");
  assert.equal(raviCall?.preferredBarberName, "Ravi");
  db.close();
});

test("4. wait is divided among on-duty non-break barbers", () => {
  const db = createDb();
  // Set Ravi on break, Amit and Imran available (2 available)
  setBarberAvailability(db, 1, true); // on break
  setBarberAvailability(db, 2, false);
  setBarberAvailability(db, 3, false);
  // Total service = 60 mins divided by 2 barbers = 30 mins
  assert.equal(calculateWait(db, 60, null), 30);
  db.close();
});

test("5. forwards-only transitions reject skipped and backwards moves", () => {
  assert.doesNotThrow(() => assertAllowedTransition("Waiting", "Called", ["Called"]));
  assert.doesNotThrow(() => assertAllowedTransition("Called", "In chair", ["In chair"]));
  assert.doesNotThrow(() => assertAllowedTransition("In chair", "Done", ["Done"]));
  assert.doesNotThrow(() => assertAllowedTransition("Waiting", "Cancelled", ["Cancelled"]));
  assert.doesNotThrow(() => assertAllowedTransition("Called", "No-show", ["No-show"]));

  // Disallowed transitions
  assert.throws(() => assertAllowedTransition("Waiting", "In chair", ["In chair"]), QueueRuleError);
  assert.throws(() => assertAllowedTransition("Waiting", "Done", ["Done"]), QueueRuleError);
  assert.throws(() => assertAllowedTransition("Called", "Waiting", ["Waiting"]), QueueRuleError);
  assert.throws(() => assertAllowedTransition("Called", "Cancelled", ["Cancelled"]), QueueRuleError);
  assert.throws(() => assertAllowedTransition("In chair", "Waiting", ["Waiting"]), QueueRuleError);
  assert.throws(() => assertAllowedTransition("Done", "Waiting", ["Waiting"]), QueueRuleError);
});

test("6. tokens reset once each day in Asia/Kolkata date", () => {
  const db = createDb();
  db.prepare("INSERT INTO salon_settings (setting_key,value) VALUES ('token_date','2000-01-01')").run();
  db.prepare("INSERT INTO salon_settings (setting_key,value) VALUES ('token_sequence','99')").run();
  const token = issueToken(db);
  assert.equal(token, "S-1");
  assert.equal(issueToken(db), "S-2");
  db.close();
});

test("7. duplicate active phone lookup is normalized and active-only", () => {
  const db = createDb();
  db.prepare(`
    INSERT INTO queue_entries
      (id,token,customer_name,phone,preferred_barber_id,status,is_walk_in,joined_at)
    VALUES (1,'S-1','Aarav','9876543210',NULL,'Waiting',0,'2026-01-01T09:00:00.000Z')
  `).run();
  assert.equal(findActiveSpot(db, "9876543210")?.id, 1);
  db.prepare("UPDATE queue_entries SET status='Cancelled' WHERE id=1").run();
  assert.equal(findActiveSpot(db, "9876543210"), undefined);
  db.close();
});

test("8. barber cannot call next if already has one client in chair", () => {
  const db = createDb();
  db.prepare(`
    INSERT INTO queue_entries
      (id,token,customer_name,phone,preferred_barber_id,assigned_barber_id,status,is_walk_in,joined_at)
    VALUES (1,'S-1','Client 1','9876543211',1,1,'In chair',0,'2026-01-01T09:00:00.000Z')
  `).run();
  db.prepare(`
    INSERT INTO queue_entries
      (id,token,customer_name,phone,preferred_barber_id,assigned_barber_id,status,is_walk_in,joined_at)
    VALUES (2,'S-2','Client 2','9876543212',1,NULL,'Waiting',0,'2026-01-01T09:05:00.000Z')
  `).run();

  // Barber 1 already has someone in chair -> must throw
  assert.throws(() => callNextCustomer(db, 1), QueueRuleError);
  db.close();
});

test("9. full lifecycle from Waiting -> Called -> In chair -> Done", () => {
  const db = createDb();
  db.prepare(`
    INSERT INTO queue_entries
      (id,token,customer_name,phone,preferred_barber_id,status,is_walk_in,joined_at)
    VALUES (10,'S-10','Vipul','9876543210',1,'Waiting',0,'2026-01-01T10:00:00.000Z')
  `).run();
  db.prepare("INSERT INTO queue_entry_services (queue_entry_id, service_id) VALUES (10, 1)").run();

  // Call
  const called = callNextCustomer(db, 1);
  assert.equal(called?.status, "Called");
  assert.equal(called?.assignedBarberName, "Ravi");

  // Start (Called -> In chair)
  const started = startCustomer(db, 1, 10);
  assert.equal(started?.status, "In chair");

  // Finish (In chair -> Done)
  const finished = finishCustomer(db, 1, 10);
  assert.equal(finished?.status, "Done");
  db.close();
});

test("10. no-show requires Called status and confirmed elapsed time", () => {
  const db = createDb();
  const elevenMinutesAgo = new Date(Date.now() - 11 * 60 * 1000).toISOString();
  db.prepare(`
    INSERT INTO queue_entries
      (id,token,customer_name,phone,preferred_barber_id,assigned_barber_id,status,is_walk_in,joined_at,called_at)
    VALUES (20,'S-20','Late Guest','9876543210',1,1,'Called',0,'2026-01-01T10:00:00.000Z',?)
  `).run(elevenMinutesAgo);

  // Without confirmation -> throws
  assert.throws(() => noShowCustomer(db, 20, false), QueueRuleError);

  // With confirmation -> succeeds
  const marked = noShowCustomer(db, 20, true);
  assert.equal(marked?.status, "No-show");
  db.close();
});

test("11. customer or receptionist can cancel only while Waiting", () => {
  const db = createDb();
  db.prepare(`
    INSERT INTO queue_entries
      (id,token,customer_name,phone,preferred_barber_id,status,is_walk_in,joined_at)
    VALUES (30,'S-30','Cancel Guest','9876543210',1,'Waiting',0,'2026-01-01T10:00:00.000Z')
  `).run();

  const cancelled = receptionistCancel(db, 30);
  assert.equal(cancelled?.status, "Cancelled");

  // Attempting to cancel already cancelled -> throws
  assert.throws(() => receptionistCancel(db, 30), QueueRuleError);
  db.close();
});
