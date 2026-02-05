#!/usr/bin/env node

import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "..", "db", "dwp-hours.db");

// Load existing database
let db;
try {
    const SQL = await initSqlJs();
    let filebuffer;
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

// Seed PTO entries
const seedPTOEntries = [
    // Sick time for coreyalix@gmail.com (employee_id: 1) - limited to 3 entries per policy
    { employee_id: 1, start_date: '2026-02-13', end_date: '2026-02-13', type: 'Sick', hours: 8 },
    { employee_id: 1, start_date: '2026-02-15', end_date: '2026-02-15', type: 'Sick', hours: 8 },
    { employee_id: 1, start_date: '2026-02-17', end_date: '2026-02-17', type: 'Sick', hours: 8 },

    // PTO for coreyalix@gmail.com - non-overlapping dates
    { employee_id: 1, start_date: '2026-02-21', end_date: '2026-02-21', type: 'PTO', hours: 8 },
    { employee_id: 1, start_date: '2026-02-23', end_date: '2026-02-23', type: 'PTO', hours: 8 },
    { employee_id: 1, start_date: '2026-02-25', end_date: '2026-02-25', type: 'PTO', hours: 8 },

    // Some PTO entries for other employees
    { employee_id: 2, start_date: '2026-01-15', end_date: '2026-01-15', type: 'PTO', hours: 8 },
    { employee_id: 2, start_date: '2026-01-17', end_date: '2026-01-17', type: 'PTO', hours: 8 },
    { employee_id: 3, start_date: '2026-01-10', end_date: '2026-01-10', type: 'PTO', hours: 8 }
];

// Seed employees
const seedEmployees = [
    {
        name: "John Doe",
        identifier: "coreyalix@gmail.com",
        pto_rate: 0.71,
        carryover_hours: 40,
        hire_date: "2020-01-15",
        role: "Employee",
        hash: "test-hash-1"
    },
    {
        name: "Jane Smith",
        identifier: "jane.smith@example.com",
        pto_rate: 0.71,
        carryover_hours: 25,
        hire_date: "2021-06-01",
        role: "Employee",
        hash: "test-hash-2"
    },
    {
        name: "Admin User",
        identifier: "admin@example.com",
        pto_rate: 0.71,
        carryover_hours: 0,
        hire_date: "2019-03-10",
        role: "Admin",
        hash: "admin-hash"
    }
];

try {
    // Truncate all tables for clean test data
    db.exec(`
        DELETE FROM admin_acknowledgements;
        DELETE FROM acknowledgements;
        DELETE FROM monthly_hours;
        DELETE FROM pto_entries;
        DELETE FROM employees;
        DELETE FROM sqlite_sequence WHERE name='employees';
        DELETE FROM sqlite_sequence WHERE name='pto_entries';
        DELETE FROM sqlite_sequence WHERE name='monthly_hours';
        DELETE FROM sqlite_sequence WHERE name='acknowledgements';
        DELETE FROM sqlite_sequence WHERE name='admin_acknowledgements';
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
            employee.hash
        ]);
    }

    stmt.free();

    // Insert seed PTO entries
    const ptoStmt = db.prepare(`
        INSERT INTO pto_entries (employee_id, start_date, end_date, type, hours)
        VALUES (?, ?, ?, ?, ?)
    `);

    for (const entry of seedPTOEntries) {
        ptoStmt.run([
            entry.employee_id,
            entry.start_date,
            entry.end_date,
            entry.type,
            entry.hours
        ]);
    }

    ptoStmt.free();

    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);

    console.log("✅ Seed data added successfully!");
    console.log("Test employees created:");
    seedEmployees.forEach(emp => {
        console.log(`  - ${emp.name} (${emp.identifier}) - ${emp.role}`);
    });
    console.log(`PTO entries added: ${seedPTOEntries.length}`);

} catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
}