import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DataSource } from 'typeorm';
import { Employee, PtoEntry, MonthlyHours, Acknowledgement, AdminAcknowledgement } from '../server/entities/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * API Integration Tests
 *
 * These tests validate the complete API request/response cycle
 * using the actual server implementation with a test database.
 *
 * Note: Currently uses a simplified server setup for testing.
 * TODO: Refactor server.mts to export route handlers as modules
 * for true integration testing.
 */

let testDb: initSqlJs.Database;
let dataSource: DataSource;
let app: express.Application;
let server: any;

beforeAll(async () => {
    // Initialize test database (same as production but in-memory)
    const SQL = await initSqlJs();
    testDb = new SQL.Database();

    // Load schema
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    testDb.exec(schema);

    // Create TypeORM data source (same as server)
    dataSource = new DataSource({
        type: 'sqljs',
        database: new Uint8Array(testDb.export()),
        entities: [Employee, PtoEntry, MonthlyHours, Acknowledgement, AdminAcknowledgement],
        synchronize: false, // Schema is managed manually like in server
        logging: false,
        autoSave: false,
    });

    await dataSource.initialize();

    // Create test app that mimics the real server setup
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // TODO: Import actual route handlers from server.mts when refactored
    // For now, use the same route implementations as unit tests
    setupIntegrationRoutes(app);

    // Start test server
    server = app.listen(0);
});

afterAll(async () => {
    if (server) {
        server.close();
    }
    if (dataSource) {
        await dataSource.destroy();
    }
    if (testDb) {
        testDb.close();
    }
});

beforeEach(async () => {
    // Clear all tables before each test (same cleanup as unit tests)
    try {
        await dataSource.getRepository(PtoEntry).clear();
        await dataSource.getRepository(MonthlyHours).clear();
        await dataSource.getRepository(Acknowledgement).clear();
        await dataSource.getRepository(AdminAcknowledgement).clear();
        await dataSource.getRepository(Employee).clear();
    } catch (error) {
        // Tables might not exist yet, ignore
    }
});

// Route setup that mirrors the actual server (for now)
// TODO: Replace with actual imported route handlers
function setupIntegrationRoutes(app: express.Application) {
    // Import the same route logic as the unit tests for now
    // This should be replaced with actual server route imports

    app.post('/api/hours', async (req, res) => {
        // Same implementation as server.mts
        try {
            const { employeeId, month, hours } = req.body;

            if (!employeeId || !month || hours === undefined) {
                return res.status(400).json({ error: 'Employee ID, month, and hours are required' });
            }

            const employeeIdNum = parseInt(employeeId);
            const hoursNum = parseFloat(hours);

            if (isNaN(employeeIdNum) || isNaN(hoursNum)) {
                return res.status(400).json({ error: 'Invalid employee ID or hours' });
            }

            if (hoursNum < 0 || hoursNum > 400) {
                return res.status(400).json({ error: 'Hours must be between 0 and 400' });
            }

            const employee = await dataSource.getRepository(Employee).findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            const monthDate = new Date(month + '-01');
            if (isNaN(monthDate.getTime())) {
                return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
            }

            const existingHours = await dataSource.getRepository(MonthlyHours).findOne({
                where: { employee_id: employeeIdNum, month: monthDate }
            });

            if (existingHours) {
                existingHours.hours_worked = hoursNum;
                existingHours.submitted_at = new Date();
                await dataSource.getRepository(MonthlyHours).save(existingHours);
                res.json({ message: 'Hours updated successfully', hours: existingHours });
            } else {
                const newHours = dataSource.getRepository(MonthlyHours).create({
                    employee_id: employeeIdNum,
                    month: monthDate,
                    hours_worked: hoursNum
                });
                await dataSource.getRepository(MonthlyHours).save(newHours);
                res.status(201).json({ message: 'Hours submitted successfully', hours: newHours });
            }
        } catch (error) {
            console.error('Error submitting hours:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Add other routes as needed...
    app.get('/api/employees/:id', async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employee = await dataSource.getRepository(Employee).findOne({ where: { id } });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            res.json(employee);
        } catch (error) {
            console.error('Error retrieving employee:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}

describe('API Integration Tests', () => {
    it('should test complete request/response cycle', async () => {
        // Create test employee
        const employee = dataSource.getRepository(Employee).create({
            name: 'Integration Test Employee',
            identifier: 'integration@example.com',
            pto_rate: 0.71,
            carryover_hours: 10,
            hire_date: new Date('2024-01-01'),
            role: 'Employee'
        });
        await dataSource.getRepository(Employee).save(employee);

        // Test POST /api/hours
        const postResponse = await request(app)
            .post('/api/hours')
            .send({
                employeeId: employee.id,
                month: '2024-06',
                hours: 160
            });

        expect(postResponse.status).toBe(201);
        expect(postResponse.body.message).toBe('Hours submitted successfully');
        expect(postResponse.body.hours.employee_id).toBe(employee.id);
        expect(postResponse.body.hours.hours_worked).toBe(160);

        // Verify data was actually saved to database
        const savedHours = await dataSource.getRepository(MonthlyHours).findOne({
            where: { employee_id: employee.id }
        });
        expect(savedHours).toBeTruthy();
        expect(savedHours?.hours_worked).toBe(160);
    });

    it('should handle full employee lifecycle', async () => {
        // Test employee creation and retrieval
        const employee = dataSource.getRepository(Employee).create({
            name: 'Lifecycle Test Employee',
            identifier: 'lifecycle@example.com',
            pto_rate: 0.71,
            carryover_hours: 10,
            hire_date: new Date('2024-01-01'),
            role: 'Employee'
        });
        await dataSource.getRepository(Employee).save(employee);

        // Test employee retrieval
        const getResponse = await request(app)
            .get(`/api/employees/${employee.id}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body.id).toBe(employee.id);
        expect(getResponse.body.name).toBe(employee.name);
    });

    it('should validate business rules end-to-end', async () => {
        const employee = dataSource.getRepository(Employee).create({
            name: 'Validation Test Employee',
            identifier: 'validation@example.com',
            pto_rate: 0.71,
            carryover_hours: 10,
            hire_date: new Date('2024-01-01'),
            role: 'Employee'
        });
        await dataSource.getRepository(Employee).save(employee);

        // Test invalid hours (too high)
        const invalidResponse = await request(app)
            .post('/api/hours')
            .send({
                employeeId: employee.id,
                month: '2024-06',
                hours: 500 // Exceeds limit
            });

        expect(invalidResponse.status).toBe(400);
        expect(invalidResponse.body.error).toBe('Hours must be between 0 and 400');

        // Test valid hours
        const validResponse = await request(app)
            .post('/api/hours')
            .send({
                employeeId: employee.id,
                month: '2024-06',
                hours: 160
            });

        expect(validResponse.status).toBe(201);
    });
});