import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DataSource } from 'typeorm';
import { Employee, PtoEntry, MonthlyHours, Acknowledgement, AdminAcknowledgement } from '../src/entities/index.js';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * API Unit Tests
 *
 * These tests validate the API business logic and validation rules
 * by testing route handlers in isolation with a test database.
 *
 * Note: This approach duplicates some logic from the server for testing purposes.
 * For true integration tests that test the actual server endpoints,
 * see api-integration.test.ts
 */

let testDb: initSqlJs.Database;
let dataSource: DataSource;
let app: express.Application;
let server: any;
const sendMagicLinkEmail = vi.fn().mockResolvedValue({ messageId: 'test-message' });

beforeAll(async () => {
    // Initialize test database
    const SQL = await initSqlJs();
    testDb = new SQL.Database();

    // Load schema
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    testDb.exec(schema);

    // Create TypeORM data source for testing
    dataSource = new DataSource({
        type: 'sqljs',
        database: new Uint8Array(testDb.export()),
        entities: [Employee, PtoEntry, MonthlyHours, Acknowledgement, AdminAcknowledgement],
        synchronize: true,
        logging: false,
        autoSave: false,
    });

    await dataSource.initialize();
    process.env.HASH_SALT = process.env.HASH_SALT || 'test_salt';

    // Create test app with the same routes as the real server
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Import and setup routes from server logic
    setupTestRoutes(app, { sendMagicLinkEmail });

    // Start test server on a random port
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
    // Clear all tables before each test
    try {
        await dataSource.getRepository(PtoEntry).clear();
        await dataSource.getRepository(MonthlyHours).clear();
        await dataSource.getRepository(Acknowledgement).clear();
        await dataSource.getRepository(AdminAcknowledgement).clear();
        await dataSource.getRepository(Employee).clear();
    } catch (error) {
        // Tables might not exist yet, ignore
    }

    sendMagicLinkEmail.mockClear();
});

// Extract route setup logic (simplified version of server routes)
function setupTestRoutes(app: express.Application, deps: { sendMagicLinkEmail: (to: string, magicLink: string) => Promise<unknown> }) {
    app.post('/api/auth/request-link', [
        body('identifier').isEmail().normalizeEmail().withMessage('Valid email address required')
    ], async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: 'Invalid input', details: errors.array() });
            }

            const { identifier } = req.body;
            const isTestMode = req.headers['x-test-mode'] === 'true' || process.env.NODE_ENV === 'test';

            const employeeRepo = dataSource.getRepository(Employee);
            const employee = await employeeRepo.findOne({ where: { identifier } });

            if (!employee) {
                return res.json({ message: 'If the email exists, a magic link has been sent.' });
            }

            let secretHash = employee.hash;
            if (!secretHash) {
                secretHash = crypto.createHash('sha256').update(identifier + (process.env.HASH_SALT || 'default_salt')).digest('hex');
                employee.hash = secretHash;
                await employeeRepo.save(employee);
            }

            const timestamp = Date.now();
            const temporalHash = crypto.createHash('sha256').update(secretHash + timestamp).digest('hex');
            const magicLink = `http://localhost:3000/?token=${temporalHash}&ts=${timestamp}`;

            if (isTestMode) {
                return res.json({
                    message: 'Magic link generated for testing',
                    magicLink
                });
            }

            await deps.sendMagicLinkEmail(identifier, magicLink);
            return res.json({ message: 'If the email exists, a magic link has been sent.' });
        } catch (error) {
            return res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Monthly Hours routes
    app.post('/api/hours', async (req, res) => {
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

    app.get('/api/hours/:employeeId', async (req, res) => {
        try {
            const { employeeId } = req.params;
            const { year } = req.query;
            const employeeIdNum = parseInt(employeeId);

            if (isNaN(employeeIdNum)) {
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employee = await dataSource.getRepository(Employee).findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            let whereCondition: any = { employee_id: employeeIdNum };
            if (year) {
                const yearNum = parseInt(year as string);
                if (!isNaN(yearNum)) {
                    whereCondition.month = (await import('typeorm')).Between(new Date(yearNum, 0, 1), new Date(yearNum, 11, 31));
                }
            }

            const hours = await dataSource.getRepository(MonthlyHours).find({
                where: whereCondition,
                order: { month: 'DESC' }
            });

            res.json({ employeeId: employeeIdNum, hours });
        } catch (error) {
            console.error('Error getting hours:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Employee routes
    app.get('/api/employees', async (req, res) => {
        try {
            const { search, role } = req.query;
            const employeeRepo = dataSource.getRepository(Employee);

            let whereCondition: any = {};

            if (search) {
                whereCondition.name = (await import('typeorm')).Like(`%${search}%`);
            }

            if (role) {
                whereCondition.role = role;
            }

            const employees = await employeeRepo.find({
                where: whereCondition,
                order: { name: 'ASC' },
                select: ['id', 'name', 'identifier', 'role', 'hire_date']
            });

            res.json(employees);
        } catch (error) {
            console.error('Error getting employees:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/api/employees/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const employeeIdNum = parseInt(id);

            if (isNaN(employeeIdNum)) {
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employee = await dataSource.getRepository(Employee).findOne({ where: { id: employeeIdNum } });

            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            res.json(employee);
        } catch (error) {
            console.error('Error getting employee:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PTO routes
    app.get('/api/pto', async (req, res) => {
        try {
            const { employeeId, type, startDate, endDate } = req.query;
            const ptoEntryRepo = dataSource.getRepository(PtoEntry);

            let whereCondition: any = {};

            if (employeeId) {
                const empIdNum = parseInt(employeeId as string);
                if (!isNaN(empIdNum)) {
                    whereCondition.employee_id = empIdNum;
                }
            }

            if (type) {
                whereCondition.type = type;
            }

            if (startDate || endDate) {
                whereCondition.start_date = {};
                if (startDate) whereCondition.start_date.$gte = new Date(startDate as string);
                if (endDate) whereCondition.start_date.$lte = new Date(endDate as string);
            }

            const ptoEntries = await ptoEntryRepo.find({
                where: whereCondition,
                order: { start_date: 'DESC' },
                relations: ['employee']
            });

            res.json(ptoEntries);
        } catch (error) {
            console.error('Error getting PTO entries:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/pto', async (req, res) => {
        try {
            const { employeeId, startDate, endDate, type, hours } = req.body;

            if (!employeeId || !startDate || !endDate || !type || hours === undefined) {
                return res.status(400).json({ error: 'All fields are required: employeeId, startDate, endDate, type, hours' });
            }

            const employeeIdNum = parseInt(employeeId);
            const hoursNum = parseFloat(hours);

            if (isNaN(employeeIdNum) || isNaN(hoursNum)) {
                return res.status(400).json({ error: 'Invalid employee ID or hours' });
            }

            const validTypes = ['PTO', 'Sick', 'Bereavement', 'Jury Duty'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ error: 'Invalid PTO type' });
            }

            if (type === 'Sick' && hoursNum > 24) {
                return res.status(400).json({ error: 'Sick time cannot exceed 24 hours annually' });
            }
            if ((type === 'Bereavement' || type === 'Jury Duty') && hoursNum > 40) {
                return res.status(400).json({ error: 'Bereavement/Jury Duty cannot exceed 40 hours annually' });
            }

            const employee = await dataSource.getRepository(Employee).findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            if (start > end) {
                return res.status(400).json({ error: 'Start date cannot be after end date' });
            }

            const newPtoEntry = dataSource.getRepository(PtoEntry).create({
                employee_id: employeeIdNum,
                start_date: start,
                end_date: end,
                type,
                hours: hoursNum
            });

            await dataSource.getRepository(PtoEntry).save(newPtoEntry);

            res.status(201).json({ message: 'PTO entry created successfully', ptoEntry: newPtoEntry });
        } catch (error) {
            console.error('Error creating PTO entry:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Admin Acknowledgement routes
    app.post('/api/admin-acknowledgements', async (req, res) => {
        try {
            const { employeeId, month, adminId } = req.body;

            if (!employeeId || !month || !adminId) {
                return res.status(400).json({ error: 'Employee ID, month, and admin ID are required' });
            }

            const employeeIdNum = parseInt(employeeId);
            const adminIdNum = parseInt(adminId);

            if (isNaN(employeeIdNum) || isNaN(adminIdNum)) {
                return res.status(400).json({ error: 'Invalid employee or admin ID' });
            }

            const employee = await dataSource.getRepository(Employee).findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            const admin = await dataSource.getRepository(Employee).findOne({ where: { id: adminIdNum } });
            if (!admin || admin.role !== 'Admin') {
                return res.status(403).json({ error: 'Admin privileges required' });
            }

            // Parse month (expected format: YYYY-MM)
            const monthStr = month;
            if (!/^\d{4}-\d{2}$/.test(monthStr)) {
                return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
            }

            // Check if admin acknowledgement already exists for this month
            const existingAck = await dataSource.getRepository(AdminAcknowledgement).findOne({
                where: { employee_id: employeeIdNum, month: monthStr }
            });

            if (existingAck) {
                return res.status(409).json({ error: 'Admin acknowledgement already exists for this month' });
            }

            // Create new admin acknowledgement
            const newAck = dataSource.getRepository(AdminAcknowledgement).create({
                employee_id: employeeIdNum,
                month: monthStr,
                admin_id: adminIdNum
            });
            await dataSource.getRepository(AdminAcknowledgement).save(newAck);

            res.status(201).json({ message: 'Admin acknowledgement submitted successfully', acknowledgement: newAck });
        } catch (error) {
            console.error('Error submitting admin acknowledgement:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/api/admin-acknowledgements/:employeeId', async (req, res) => {
        try {
            const { employeeId } = req.params;
            const { adminId } = req.query;
            const employeeIdNum = parseInt(employeeId);
            const adminIdNum = parseInt(adminId as string);

            if (isNaN(employeeIdNum) || isNaN(adminIdNum)) {
                return res.status(400).json({ error: 'Invalid employee or admin ID' });
            }

            const admin = await dataSource.getRepository(Employee).findOne({ where: { id: adminIdNum } });
            if (!admin || admin.role !== 'Admin') {
                return res.status(403).json({ error: 'Admin privileges required' });
            }

            const employee = await dataSource.getRepository(Employee).findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            const acknowledgements = await dataSource.getRepository(AdminAcknowledgement).find({
                where: { employee_id: employeeIdNum },
                order: { month: 'DESC' },
                relations: ['admin']
            });

            res.json({ employeeId: employeeIdNum, acknowledgements });
        } catch (error) {
            console.error('Error getting admin acknowledgements:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
}

describe('Auth magic link request', () => {
    it('returns magic link in test mode without sending email', async () => {
        const employee = dataSource.getRepository(Employee).create({
            name: 'Magic Link User',
            identifier: 'magiclink@example.com',
            pto_rate: 0.71,
            carryover_hours: 0,
            hire_date: new Date('2024-01-01'),
            role: 'Employee'
        });
        await dataSource.getRepository(Employee).save(employee);

        const response = await request(app)
            .post('/api/auth/request-link')
            .set('x-test-mode', 'true')
            .send({ identifier: 'magiclink@example.com' });

        expect(response.status).toBe(200);
        expect(response.body.magicLink).toContain('http://localhost:3000/?token=');
        expect(sendMagicLinkEmail).not.toHaveBeenCalled();
    });

    it('sends email in non-test mode without returning magic link', async () => {
        const originalNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';

        const employee = dataSource.getRepository(Employee).create({
            name: 'Magic Link User 2',
            identifier: 'magiclink2@example.com',
            pto_rate: 0.71,
            carryover_hours: 0,
            hire_date: new Date('2024-01-01'),
            role: 'Employee'
        });
        await dataSource.getRepository(Employee).save(employee);

        const response = await request(app)
            .post('/api/auth/request-link')
            .send({ identifier: 'magiclink2@example.com' });

        expect(response.status).toBe(200);
        expect(response.body.magicLink).toBeUndefined();
        expect(sendMagicLinkEmail).toHaveBeenCalledTimes(1);
        expect(sendMagicLinkEmail.mock.calls[0]?.[0]).toBe('magiclink2@example.com');
        expect(sendMagicLinkEmail.mock.calls[0]?.[1]).toContain('http://localhost:3000/?token=');

        process.env.NODE_ENV = originalNodeEnv;
    });
});

describe('API Endpoints', () => {
    describe('Monthly Hours API', () => {
        it('should submit monthly hours successfully', async () => {
            // Create test employee first
            const employee = dataSource.getRepository(Employee).create({
                name: 'Test Employee',
                identifier: 'test@example.com',
                pto_rate: 0.71,
                carryover_hours: 10,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });
            await dataSource.getRepository(Employee).save(employee);

            const response = await request(app)
                .post('/api/hours')
                .send({
                    employeeId: employee.id,
                    month: '2024-06',
                    hours: 160
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Hours submitted successfully');
            expect(response.body.hours.employee_id).toBe(employee.id);
            expect(response.body.hours.hours_worked).toBe(160);
        });

        it('should validate required fields for hours submission', async () => {
            const response = await request(app)
                .post('/api/hours')
                .send({ employeeId: 1 }); // Missing month and hours

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Employee ID, month, and hours are required');
        });

        it('should validate hours range', async () => {
            const employee = dataSource.getRepository(Employee).create({
                name: 'Test Employee 2',
                identifier: 'test2@example.com',
                pto_rate: 0.71,
                carryover_hours: 10,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });
            await dataSource.getRepository(Employee).save(employee);

            const response = await request(app)
                .post('/api/hours')
                .send({
                    employeeId: employee.id,
                    month: '2024-06',
                    hours: 500 // Exceeds maximum
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Hours must be between 0 and 400');
        });

        it('should retrieve hours for an employee', async () => {
            const employee = dataSource.getRepository(Employee).create({
                name: 'Test Employee 3',
                identifier: 'test3@example.com',
                pto_rate: 0.71,
                carryover_hours: 10,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });
            await dataSource.getRepository(Employee).save(employee);

            // Submit hours
            await request(app)
                .post('/api/hours')
                .send({
                    employeeId: employee.id,
                    month: '2024-06',
                    hours: 160
                });

            const response = await request(app)
                .get(`/api/hours/${employee.id}`);

            expect(response.status).toBe(200);
            expect(response.body.employeeId).toBe(employee.id);
            expect(response.body.hours).toHaveLength(1);
            expect(response.body.hours[0].hours_worked).toBe(160);
        });
    });

    describe('Employee API', () => {
        it('should list all employees', async () => {
            const employee1 = dataSource.getRepository(Employee).create({
                name: 'Alice Johnson',
                identifier: 'alice@example.com',
                pto_rate: 0.71,
                carryover_hours: 10,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });
            const employee2 = dataSource.getRepository(Employee).create({
                name: 'Bob Smith',
                identifier: 'bob@example.com',
                pto_rate: 0.71,
                carryover_hours: 10,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });
            await dataSource.getRepository(Employee).save([employee1, employee2]);

            const response = await request(app)
                .get('/api/employees');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0].name).toBe('Alice Johnson');
            expect(response.body[1].name).toBe('Bob Smith');
        });

        it('should search employees by name', async () => {
            const employee = dataSource.getRepository(Employee).create({
                name: 'Alice Johnson',
                identifier: 'alice2@example.com',
                pto_rate: 0.71,
                carryover_hours: 10,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });
            await dataSource.getRepository(Employee).save(employee);

            const response = await request(app)
                .get('/api/employees?search=Alice');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe('Alice Johnson');
        });

        it('should get individual employee', async () => {
            const employee = dataSource.getRepository(Employee).create({
                name: 'Test Employee 4',
                identifier: 'test4@example.com',
                pto_rate: 0.71,
                carryover_hours: 10,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });
            await dataSource.getRepository(Employee).save(employee);

            const response = await request(app)
                .get(`/api/employees/${employee.id}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(employee.id);
            expect(response.body.name).toBe(employee.name);
        });
    });

    describe('PTO API', () => {
        it('should create PTO entry successfully', async () => {
            const employee = dataSource.getRepository(Employee).create({
                name: 'Test Employee 5',
                identifier: 'test5@example.com',
                pto_rate: 0.71,
                carryover_hours: 10,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });
            await dataSource.getRepository(Employee).save(employee);

            const response = await request(app)
                .post('/api/pto')
                .send({
                    employeeId: employee.id,
                    startDate: '2024-06-01',
                    endDate: '2024-06-05',
                    type: 'PTO',
                    hours: 32
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('PTO entry created successfully');
            expect(response.body.ptoEntry.employee_id).toBe(employee.id);
            expect(response.body.ptoEntry.hours).toBe(32);
        });

        it('should validate PTO type', async () => {
            const employee = dataSource.getRepository(Employee).create({
                name: 'Test Employee 6',
                identifier: 'test6@example.com',
                pto_rate: 0.71,
                carryover_hours: 10,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });
            await dataSource.getRepository(Employee).save(employee);

            const response = await request(app)
                .post('/api/pto')
                .send({
                    employeeId: employee.id,
                    startDate: '2024-06-01',
                    endDate: '2024-06-05',
                    type: 'InvalidType',
                    hours: 32
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid PTO type');
        });

        it('should validate sick time limits', async () => {
            const employee = dataSource.getRepository(Employee).create({
                name: 'Test Employee 7',
                identifier: 'test7@example.com',
                pto_rate: 0.71,
                carryover_hours: 10,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });
            await dataSource.getRepository(Employee).save(employee);

            const response = await request(app)
                .post('/api/pto')
                .send({
                    employeeId: employee.id,
                    startDate: '2024-06-01',
                    endDate: '2024-06-05',
                    type: 'Sick',
                    hours: 30 // Exceeds 24 hour limit
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Sick time cannot exceed 24 hours annually');
        });

        it('should list PTO entries', async () => {
            const employee = dataSource.getRepository(Employee).create({
                name: 'Test Employee 8',
                identifier: 'test8@example.com',
                pto_rate: 0.71,
                carryover_hours: 10,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });
            await dataSource.getRepository(Employee).save(employee);

            await dataSource.getRepository(PtoEntry).save({
                employee_id: employee.id,
                start_date: new Date('2024-06-01'),
                end_date: new Date('2024-06-05'),
                type: 'PTO',
                hours: 32
            });

            const response = await request(app)
                .get('/api/pto');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].employee_id).toBe(employee.id);
        });
    });

    describe('Admin Acknowledgement API', () => {
        it('should create admin acknowledgement successfully', async () => {
            const employee = await dataSource.getRepository(Employee).save({
                name: 'Test Employee',
                identifier: 'test@example.com',
                pto_rate: 0.71,
                carryover_hours: 0,
                hire_date: new Date('2023-01-01'),
                role: 'Employee'
            });

            const admin = await dataSource.getRepository(Employee).save({
                name: 'Test Admin',
                identifier: 'admin@example.com',
                pto_rate: 0.71,
                carryover_hours: 0,
                hire_date: new Date('2023-01-01'),
                role: 'Admin'
            });

            const response = await request(app)
                .post('/api/admin-acknowledgements')
                .send({
                    employeeId: employee.id,
                    month: '2024-01',
                    adminId: admin.id
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Admin acknowledgement submitted successfully');
            expect(response.body.acknowledgement).toBeDefined();
            expect(response.body.acknowledgement.employee_id).toBe(employee.id);
            expect(response.body.acknowledgement.admin_id).toBe(admin.id);
            expect(new Date(response.body.acknowledgement.month).toISOString().slice(0, 10)).toBe('2024-01-01');
        });

        it('should reject admin acknowledgement with invalid employee', async () => {
            const admin = await dataSource.getRepository(Employee).save({
                name: 'Test Admin 2',
                identifier: 'admin2@example.com',
                pto_rate: 0.71,
                carryover_hours: 0,
                hire_date: new Date('2023-01-01'),
                role: 'Admin'
            });

            const response = await request(app)
                .post('/api/admin-acknowledgements')
                .send({
                    employeeId: 999,
                    month: '2024-01',
                    adminId: admin.id
                });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Employee not found');
        });

        it('should reject admin acknowledgement with non-admin user', async () => {
            const employee = await dataSource.getRepository(Employee).save({
                name: 'Test Employee 2',
                identifier: 'test2@example.com',
                pto_rate: 0.71,
                carryover_hours: 0,
                hire_date: new Date('2023-01-01'),
                role: 'Employee'
            });

            const nonAdmin = await dataSource.getRepository(Employee).save({
                name: 'Test Non-Admin',
                identifier: 'nonadmin@example.com',
                pto_rate: 0.71,
                carryover_hours: 0,
                hire_date: new Date('2023-01-01'),
                role: 'Employee'
            });

            const response = await request(app)
                .post('/api/admin-acknowledgements')
                .send({
                    employeeId: employee.id,
                    month: '2024-01',
                    adminId: nonAdmin.id
                });

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Admin privileges required');
        });

        it('should prevent duplicate admin acknowledgements for same month', async () => {
            const employee = await dataSource.getRepository(Employee).save({
                name: 'Test Employee 3',
                identifier: 'test3@example.com',
                pto_rate: 0.71,
                carryover_hours: 0,
                hire_date: new Date('2023-01-01'),
                role: 'Employee'
            });

            const admin = await dataSource.getRepository(Employee).save({
                name: 'Test Admin 3',
                identifier: 'admin3@example.com',
                pto_rate: 0.71,
                carryover_hours: 0,
                hire_date: new Date('2023-01-01'),
                role: 'Admin'
            });

            // Create first acknowledgement
            const firstResponse = await request(app)
                .post('/api/admin-acknowledgements')
                .send({
                    employeeId: employee.id,
                    month: '2024-01',
                    adminId: admin.id
                });

            expect(firstResponse.status).toBe(201); // Ensure first one succeeds

            // Check that it was actually saved
            const savedAcks = await dataSource.getRepository(AdminAcknowledgement).find({
                where: { employee_id: employee.id }
            });
            expect(savedAcks).toHaveLength(1);

            // Try to create duplicate
            const response = await request(app)
                .post('/api/admin-acknowledgements')
                .send({
                    employeeId: employee.id,
                    month: '2024-01',
                    adminId: admin.id
                });

            expect(response.status).toBe(409);
            expect(response.body.error).toBe('Admin acknowledgement already exists for this month');
        });

        it('should retrieve admin acknowledgements for employee', async () => {
            const employee = await dataSource.getRepository(Employee).save({
                name: 'Test Employee 4',
                identifier: 'test4@example.com',
                pto_rate: 0.71,
                carryover_hours: 0,
                hire_date: new Date('2023-01-01'),
                role: 'Employee'
            });

            const admin = await dataSource.getRepository(Employee).save({
                name: 'Test Admin 4',
                identifier: 'admin4@example.com',
                pto_rate: 0.71,
                carryover_hours: 0,
                hire_date: new Date('2023-01-01'),
                role: 'Admin'
            });

            // Create acknowledgement
            await request(app)
                .post('/api/admin-acknowledgements')
                .send({
                    employeeId: employee.id,
                    month: '2024-01',
                    adminId: admin.id
                });

            const response = await request(app)
                .get(`/api/admin-acknowledgements/${employee.id}?adminId=${admin.id}`);

            expect(response.status).toBe(200);
            expect(response.body.employeeId).toBe(employee.id);
            expect(response.body.acknowledgements).toHaveLength(1);
            expect(response.body.acknowledgements[0].employee_id).toBe(employee.id);
            expect(response.body.acknowledgements[0].admin_id).toBe(admin.id);
            expect(response.body.acknowledgements[0].admin).toBeDefined();
            expect(response.body.acknowledgements[0].admin.name).toBe('Test Admin 4');
        });
    });
});
