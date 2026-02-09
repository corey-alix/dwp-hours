#!/usr/bin/env node

import initSqlJs from "sql.js";
import type { Database } from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { seedEmployees, seedPTOEntries } from "./seedData.js";
import {
  validateHours,
  validateWeekday,
  validatePTOType,
  validateDateString,
} from "../shared/businessRules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "..", "db", "dwp-hours.db");

// Load existing database
let db: Database;
try {
  const SQL = await initSqlJs();
  let filebuffer: Uint8Array | undefined;
  if (fs.existsSync(DB_PATH)) {
    filebuffer = fs.readFileSync(DB_PATH);
  }
  db = new SQL.Database(filebuffer);

  // Always execute schema to ensure tables exist
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema);
} catch (error) {
  console.error("Failed to load database:", error);
  process.exit(1);
}

try {
  // Truncate all tables for clean test data
  db.exec(`
        DELETE FROM admin_acknowledgements;
        DELETE FROM acknowledgements;
        DELETE FROM monthly_hours;
        DELETE FROM pto_entries;
        DELETE FROM sessions;
        DELETE FROM employees;
        DELETE FROM sqlite_sequence WHERE name='employees';
        DELETE FROM sqlite_sequence WHERE name='pto_entries';
        DELETE FROM sqlite_sequence WHERE name='monthly_hours';
        DELETE FROM sqlite_sequence WHERE name='acknowledgements';
        DELETE FROM sqlite_sequence WHERE name='admin_acknowledgements';
        DELETE FROM sqlite_sequence WHERE name='sessions';
    `);

  // Insert seed employees
  const stmt = db.prepare(`
        INSERT INTO employees (name, identifier, pto_rate, carryover_hours, hire_date, role, hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const employee of seedEmployees) {
    stmt.run([
      employee.name,
      employee.identifier,
      employee.pto_rate,
      employee.carryover_hours,
      employee.hire_date,
      employee.role,
      employee.hash,
    ]);
  }

  stmt.free();

  // Insert seed PTO entries
  const ptoStmt = db.prepare(`
        INSERT INTO pto_entries (employee_id, date, type, hours)
        VALUES (?, ?, ?, ?)
    `);

  for (const entry of seedPTOEntries) {
    // Validate entry using business rules
    const dateErr = validateDateString(entry.date);
    if (dateErr) {
      console.error(
        `Skipping invalid PTO entry (invalid date): ${JSON.stringify(entry)} - ${dateErr.messageKey}`,
      );
      continue;
    }

    const weekdayErr = validateWeekday(entry.date);
    if (weekdayErr) {
      console.error(
        `Skipping invalid PTO entry (not weekday): ${JSON.stringify(entry)} - ${weekdayErr.messageKey}`,
      );
      continue;
    }

    const hoursErr = validateHours(entry.hours);
    if (hoursErr) {
      console.error(
        `Skipping invalid PTO entry (invalid hours): ${JSON.stringify(entry)} - ${hoursErr.messageKey}`,
      );
      continue;
    }

    const typeErr = validatePTOType(entry.type);
    if (typeErr) {
      console.error(
        `Skipping invalid PTO entry (invalid type): ${JSON.stringify(entry)} - ${typeErr.messageKey}`,
      );
      continue;
    }

    ptoStmt.run([entry.employee_id, entry.date, entry.type, entry.hours]);
  }

  ptoStmt.free();

  // Save database
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);

  console.log("✅ Seed data added successfully!");
  console.log("Test employees created:");
  seedEmployees.forEach((emp) => {
    console.log(`  - ${emp.name} (${emp.identifier}) - ${emp.role}`);
  });
  console.log(`PTO entries added: ${seedPTOEntries.length}`);
} catch (error) {
  console.error("Failed to seed database:", error);
  process.exit(1);
}
