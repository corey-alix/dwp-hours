import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DataSource } from 'typeorm';
import { Employee, PtoEntry, MonthlyHours, Acknowledgement } from '../src/entities/index.js';

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
        entities: [Employee, PtoEntry, MonthlyHours, Acknowledgement],
        synchronize: true,
        logging: false,
        autoSave: false,
    });

    await dataSource.initialize();

    // Create test app with the same routes as the real server
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Import and setup routes from server logic
    setupTestRoutes(app);

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
        await dataSource.getRepository(Employee).clear();
    } catch (error) {
        // Tables might not exist yet, ignore
    }
});

// Extract route setup logic (simplified version of server routes)
function setupTestRoutes(app: express.Application) {
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
}

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
});
