import { describe, it, expect } from 'vitest';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Database Persistence', () => {
    it('should create database from schema, manipulate data, save, and reload', async () => {
        // Initialize SQL.js
        const SQL = await initSqlJs();

        // Create initial database
        let db = new SQL.Database();

        // Load and execute schema
        const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);

        // Insert test data
        db.exec(`
      INSERT INTO employees (name, identifier, pto_rate) VALUES
      ('John Doe', 'JD001', 0.8),
      ('Jane Smith', 'JS002', 0.7);
    `);

        // Query data
        const employees = db.exec('SELECT * FROM employees ORDER BY id');
        expect(employees[0].values.length).toBe(2);
        expect(employees[0].values[0][1]).toBe('John Doe'); // name
        expect(employees[0].values[1][1]).toBe('Jane Smith');

        // Insert PTO entry
        db.exec(`
      INSERT INTO pto_entries (employee_id, start_date, end_date, type, hours)
      VALUES (1, '2026-02-01', '2026-02-01', 'Sick', 8);
    `);

        // Query PTO
        const pto = db.exec('SELECT * FROM pto_entries');
        expect(pto[0].values.length).toBe(1);
        expect(pto[0].values[0][5]).toBe(8); // hours

        // Export database
        const exportedData = db.export();

        // Create new database and import
        db = new SQL.Database(exportedData);

        // Query again to confirm persistence
        const reloadedEmployees = db.exec('SELECT * FROM employees ORDER BY id');
        expect(reloadedEmployees[0].values.length).toBe(2);
        expect(reloadedEmployees[0].values[0][1]).toBe('John Doe');

        const reloadedPto = db.exec('SELECT * FROM pto_entries');
        expect(reloadedPto[0].values.length).toBe(1);
        expect(reloadedPto[0].values[0][5]).toBe(8);

        // Manipulate data in reloaded DB
        db.exec(`UPDATE employees SET name = 'John Updated' WHERE id = 1`);
        db.exec(`INSERT INTO monthly_hours (employee_id, month, hours_worked) VALUES (1, '2026-02-01', 160)`);

        // Export again
        const updatedData = db.export();

        // Reload once more
        db = new SQL.Database(updatedData);

        // Confirm updates persisted
        const updatedEmployees = db.exec('SELECT name FROM employees WHERE id = 1');
        expect(updatedEmployees[0].values[0][0]).toBe('John Updated');

        const monthlyHours = db.exec('SELECT hours_worked FROM monthly_hours WHERE employee_id = 1');
        expect(monthlyHours[0].values[0][0]).toBe(160);

        db.close();
    });
});