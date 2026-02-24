import { describe, it, expect } from "vitest";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Database Schema and Persistence", () => {
  async function createDatabase() {
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    db.exec(schema);
    return { db, SQL };
  }

  it("Database Initialization Test: should create all required tables without errors", async () => {
    const { db } = await createDatabase();

    // Query sqlite_master to check tables exist
    const tables = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
    );
    const tableNames = tables[0].values.map((row) => row[0]).sort();

    expect(tableNames).toEqual([
      "acknowledgements",
      "admin_acknowledgements",
      "employees",
      "monthly_hours",
      "notifications",
      "pto_entries",
      "sessions",
    ]);

    db.close();
  });

  it("Schema Validation Test: should have correct data types, indexes, and constraints", async () => {
    const { db } = await createDatabase();

    // Check employees table structure
    const employeesInfo = db.exec("PRAGMA table_info(employees)");
    expect(employeesInfo[0].values).toEqual(
      expect.arrayContaining([
        [0, "id", "INTEGER", 0, null, 1], // pk
        [1, "name", "TEXT", 1, null, 0], // not null
        [2, "identifier", "TEXT", 1, null, 0], // not null
        [3, "pto_rate", "REAL", 0, "0.71", 0], // default
        [4, "carryover_hours", "REAL", 0, "0", 0],
        [5, "hire_date", "DATE", 1, null, 0], // not null
        [6, "role", "TEXT", 0, "'Employee'", 0],
        [7, "hash", "TEXT", 0, null, 0],
      ]),
    );

    // Check indexes exist
    const indexes = db.exec(
      "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'",
    );
    const indexNames = indexes[0].values.map((row) => row[0]).sort();
    expect(indexNames).toEqual([
      "idx_acknowledgements_employee_id",
      "idx_acknowledgements_month",
      "idx_admin_acknowledgements_admin_id",
      "idx_admin_acknowledgements_employee_id",
      "idx_admin_acknowledgements_month",
      "idx_monthly_hours_employee_id",
      "idx_monthly_hours_month",
      "idx_notifications_employee_id",
      "idx_notifications_expires_at",
      "idx_notifications_read_at",
      "idx_pto_entries_approved_by",
      "idx_pto_entries_date",
      "idx_pto_entries_employee_id",
      "idx_sessions_employee_id",
      "idx_sessions_expires_at",
    ]);

    // Test UNIQUE constraint on employees.identifier
    expect(() => {
      db.exec(
        "INSERT INTO employees (name, identifier) VALUES ('Test1', 'unique')",
      );
      db.exec(
        "INSERT INTO employees (name, identifier) VALUES ('Test2', 'unique')",
      );
    }).toThrow();

    // Test CHECK constraint on pto_entries.type
    expect(() => {
      db.exec(
        "INSERT INTO employees (name, identifier) VALUES ('Test', 'T001')",
      );
      db.exec(
        "INSERT INTO pto_entries (employee_id, start_date, end_date, type, hours) VALUES (1, '2026-01-01', '2026-01-01', 'Invalid', 8)",
      );
    }).toThrow();

    db.close();
  });

  it("Foreign Key Constraints Test: should enforce referential integrity", async () => {
    const { db } = await createDatabase();

    // Insert employee
    db.exec(
      "INSERT INTO employees (name, identifier, hire_date) VALUES ('Test', 'T001', '2024-01-01')",
    );

    // Valid foreign key should work
    db.exec(
      "INSERT INTO pto_entries (employee_id, date, type, hours) VALUES (1, '2026-01-01', 'Sick', 8)",
    );

    // Invalid foreign key should fail
    expect(() => {
      db.exec(
        "INSERT INTO pto_entries (employee_id, date, type, hours) VALUES (999, '2026-01-01', 'Sick', 8)",
      );
    }).toThrow();

    // Test CASCADE delete
    db.exec("DELETE FROM employees WHERE id = 1");
    const ptoCount = db.exec("SELECT COUNT(*) FROM pto_entries");
    expect(ptoCount[0].values[0][0]).toBe(0);

    db.close();
  });

  it("should create database from schema, manipulate data, save, and reload", async () => {
    // Initialize SQL.js
    const SQL = await initSqlJs();

    // Create initial database
    let db = new SQL.Database();

    // Load and execute schema
    const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    db.exec(schema);

    // Insert test data
    db.exec(`
      INSERT INTO employees (name, identifier, hire_date) VALUES
      ('John Doe', 'JD001', '2020-01-01'),
      ('Jane Smith', 'JS002', '2021-01-01');
    `);

    // Query data
    const employees = db.exec("SELECT * FROM employees ORDER BY id");
    expect(employees[0].values.length).toBe(2);
    expect(employees[0].values[0][1]).toBe("John Doe"); // name
    expect(employees[0].values[1][1]).toBe("Jane Smith");

    // Insert PTO entry
    db.exec(`
      INSERT INTO pto_entries (employee_id, date, type, hours)
      VALUES (1, '2026-02-01', 'Sick', 8);
    `);

    // Query PTO
    const pto = db.exec("SELECT * FROM pto_entries");
    expect(pto[0].values.length).toBe(1);
    expect(pto[0].values[0][4]).toBe(8); // hours

    // Export database
    const exportedData = db.export();

    // Create new database and import
    db = new SQL.Database(exportedData);

    // Query again to confirm persistence
    const reloadedEmployees = db.exec("SELECT * FROM employees ORDER BY id");
    expect(reloadedEmployees[0].values.length).toBe(2);
    expect(reloadedEmployees[0].values[0][1]).toBe("John Doe");

    const reloadedPto = db.exec("SELECT * FROM pto_entries");
    expect(reloadedPto[0].values.length).toBe(1);
    expect(reloadedPto[0].values[0][4]).toBe(8);

    // Manipulate data in reloaded DB
    db.exec(`UPDATE employees SET name = 'John Updated' WHERE id = 1`);
    db.exec(
      `INSERT INTO monthly_hours (employee_id, month, hours_worked) VALUES (1, '2026-02-01', 160)`,
    );

    // Export again
    const updatedData = db.export();

    // Reload once more
    db = new SQL.Database(updatedData);

    // Confirm updates persisted
    const updatedEmployees = db.exec("SELECT name FROM employees WHERE id = 1");
    expect(updatedEmployees[0].values[0][0]).toBe("John Updated");

    const monthlyHours = db.exec(
      "SELECT hours_worked FROM monthly_hours WHERE employee_id = 1",
    );
    expect(monthlyHours[0].values[0][0]).toBe(160);

    db.close();
  });
});
