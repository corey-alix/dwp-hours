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

// Seed data
const seedEmployees = [
    {
        name: "John Doe",
        identifier: "john.doe",
        pto_rate: 0.71,
        carryover_hours: 40,
        hire_date: "2020-01-15",
        role: "Employee",
        hash: "test-hash-1"
    },
    {
        name: "Jane Smith",
        identifier: "jane.smith",
        pto_rate: 0.71,
        carryover_hours: 25,
        hire_date: "2021-06-01",
        role: "Employee",
        hash: "test-hash-2"
    },
    {
        name: "Admin User",
        identifier: "admin",
        pto_rate: 0.71,
        carryover_hours: 0,
        hire_date: "2019-03-10",
        role: "Admin",
        hash: "admin-hash"
    }
];

try {
    // Insert seed employees
    const stmt = db.prepare(`
    INSERT OR IGNORE INTO employees (name, identifier, pto_rate, carryover_hours, hire_date, role, hash)
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

    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);

    console.log("✅ Seed data added successfully!");
    console.log("Test employees created:");
    seedEmployees.forEach(emp => {
        console.log(`  - ${emp.name} (${emp.identifier}) - ${emp.role}`);
    });

} catch (error) {
    console.error("Failed to seed database:", error);
    process.exit(1);
}