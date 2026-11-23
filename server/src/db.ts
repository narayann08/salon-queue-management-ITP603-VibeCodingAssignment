import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dataDirectory = path.resolve(process.cwd(), "server", "data");
fs.mkdirSync(dataDirectory, { recursive: true });

const databasePath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(dataDirectory, "salon.db");

export const db = new Database(databasePath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS barbers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    on_duty INTEGER NOT NULL DEFAULT 1,
    on_break INTEGER NOT NULL DEFAULT 0,
    photo_url TEXT
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en TEXT NOT NULL,
    name_gu TEXT NOT NULL,
    minutes INTEGER NOT NULL CHECK (minutes > 0),
    price INTEGER NOT NULL CHECK (price >= 0),
    enabled INTEGER NOT NULL DEFAULT 1
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS queue_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    preferred_barber_id INTEGER,
    status TEXT NOT NULL,
    is_walk_in INTEGER NOT NULL DEFAULT 0,
    joined_at TEXT NOT NULL,
    called_at TEXT,
    started_at TEXT,
    finished_at TEXT,
    FOREIGN KEY (preferred_barber_id) REFERENCES barbers(id)
  );
`);
const queueColumns = db.prepare("PRAGMA table_info(queue_entries)").all() as Array<{ name: string }>;
if (!queueColumns.some((column) => column.name === "assigned_barber_id")) {
  db.exec(`
    ALTER TABLE queue_entries
    ADD COLUMN assigned_barber_id INTEGER REFERENCES barbers(id)
  `);
}
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_queue_phone_status
    ON queue_entries(phone, status)
`);
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_queue_status_joined
    ON queue_entries(status, joined_at)
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS queue_entry_services (
    queue_entry_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    PRIMARY KEY (queue_entry_id, service_id),
    FOREIGN KEY (queue_entry_id) REFERENCES queue_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(id)
  );
`);
db.exec(`
  CREATE TABLE IF NOT EXISTS salon_settings (
    setting_key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);
db.prepare(
  "INSERT OR IGNORE INTO salon_settings (setting_key, value) VALUES (?, ?)",
).run("is_open", "1");
db.prepare(
  "INSERT OR IGNORE INTO salon_settings (setting_key, value) VALUES (?, ?)",
).run("closing_time", "21:00");

const barberCount = db.prepare("SELECT COUNT(*) AS count FROM barbers").get() as { count: number };
if (barberCount.count === 0) {
  const insertBarber = db.prepare(
    "INSERT INTO barbers (name, on_duty, on_break) VALUES (?, 1, 0)",
  );
  const seedBarbers = db.transaction(() => {
    for (const name of ["Ravi", "Amit", "Imran"]) insertBarber.run(name);
  });
  seedBarbers();
}

const serviceCount = db.prepare("SELECT COUNT(*) AS count FROM services").get() as { count: number };
if (serviceCount.count === 0) {
  const insertService = db.prepare(`
    INSERT INTO services (name_en, name_gu, minutes, price, enabled)
    VALUES (?, ?, ?, ?, 1)
  `);
  const seedServices = db.transaction(() => {
    const services = [
      ["Haircut", "હેરકટ", 30, 150],
      ["Beard trim", "દાઢી ટ્રિમ", 15, 80],
      ["Hair spa", "હેર સ્પા", 45, 400],
      ["Hair colour", "હેર કલર", 60, 650],
      ["Head massage", "માથાનું મસાજ", 20, 180],
      ["Face cleanup", "ફેસ ક્લીનઅપ", 40, 350],
    ];
    for (const service of services) insertService.run(...service);
  });
  seedServices();
}
