import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DataSource } from 'typeorm';
import { Employee, PtoEntry, MonthlyHours, Acknowledgement, AdminAcknowledgement } from '../server/entities/index.js';
import { PtoEntryDAL } from '../server/dal/PtoEntryDAL.js';
import { performBulkMigration } from '../server/bulkMigration.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testDb: initSqlJs.Database;
let dataSource: DataSource;
let dal: PtoEntryDAL;
let app: express.Application;
let server: any;

// Mock log function
const log = (message: string) => {
    console.log(message);
};

// Mock today function
const today = () => '2025-01-01';

// Mock isValidDateString
const isValidDateString = (date: string) => {
    const d = new Date(date);
    return d instanceof Date && !isNaN(d.getTime());
};

beforeAll(async () => {
    // Initialize test database
    const SQL = await initSqlJs();
    testDb = new SQL.Database();

    // Load schema
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    testDb.exec(schema);

    // Create TypeORM data source
    dataSource = new DataSource({
        type: 'sqljs',
        database: new Uint8Array(testDb.export()),
        entities: [Employee, PtoEntry, MonthlyHours, Acknowledgement, AdminAcknowledgement],
        synchronize: false,
        logging: false,
        autoSave: false,
    });

    await dataSource.initialize();

    dal = new PtoEntryDAL(dataSource);

    // Create test app
    app = express();
    app.use(express.json());

    // Add the bulk migration route using the imported function
    app.post('/api/migrate/bulk', async (req, res) => {
        try {
            const result = await performBulkMigration(
                dataSource,
                dal,
                log,
                today,
                isValidDateString,
                req.body
            );
            res.json(result);
        } catch (error) {
            if (error instanceof Error && error.message === 'Valid employee email is required') {
                return res.status(400).json({ error: error.message });
            }
            log(`Error in bulk migration: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

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
});

describe('Bulk Data Migration API', () => {
    it('should successfully import bulk data for a new employee', async () => {
        const bulkData = {
            employeeEmail: 'test-bulk-import@example.com',
            monthlyHours: [
                { month: '2025-01', hours: 160 }, // January: 20 work days * 8 hours
                { month: '2025-02', hours: 152 }, // February: 19 work days * 8 hours
                { month: '2025-03', hours: 168 }  // March: 21 work days * 8 hours
            ],
            ptoEntries: [
                { date: '2025-01-15', hours: 8, type: 'PTO' },
                { date: '2025-02-12', hours: 8, type: 'Sick' },
                { date: '2025-03-05', hours: 8, type: 'PTO' }
            ]
        };

        const response = await request(app)
            .post('/api/migrate/bulk')
            .send(bulkData);

        expect(response.status).toBe(200);
        const result = response.body;

        expect(result.message).toBe('Bulk migration completed');
        expect(result.employeeId).toBeDefined();
        expect(typeof result.employeeId).toBe('number');
        expect(result.summary).toEqual({
            monthlyHoursInserted: 3,
            monthlyHoursSkipped: 0,
            ptoEntriesInserted: 3,
            ptoEntriesSkipped: 0
        });
        expect(result.warnings).toEqual([]);

        // Verify the data was actually inserted by checking the database
        const employees = await dataSource.getRepository(Employee).find();
        const newEmployee = employees.find((emp: any) => emp.identifier === 'test-bulk-import@example.com');
        expect(newEmployee).toBeDefined();
        expect(newEmployee!.name).toBe('test-bulk-import'); // Uses email prefix as name
    });

    it('should handle duplicate data gracefully', async () => {
        const bulkData = {
            employeeEmail: 'test-duplicate@example.com',
            monthlyHours: [
                { month: '2025-01', hours: 160 }
            ],
            ptoEntries: [
                { date: '2025-01-15', hours: 8, type: 'PTO' }
            ]
        };

        // First import
        await request(app)
            .post('/api/migrate/bulk')
            .send(bulkData);

        // Second import with same data
        const response = await request(app)
            .post('/api/migrate/bulk')
            .send(bulkData);

        expect(response.status).toBe(200);
        const result = response.body;

        expect(result.summary).toEqual({
            monthlyHoursInserted: 0,
            monthlyHoursSkipped: 1,
            ptoEntriesInserted: 0,
            ptoEntriesSkipped: 1
        });
        expect(result.warnings.length).toBe(2); // One for monthly hours, one for PTO
        expect(result.warnings[0]).toContain('Monthly hours already exist');
        expect(result.warnings[1]).toContain('PTO entry already exists');
    });

    it('should validate input data', async () => {
        const response = await request(app)
            .post('/api/migrate/bulk')
            .send({
                employeeEmail: 'invalid-email',
                monthlyHours: [],
                ptoEntries: []
            });

        expect(response.status).toBe(400);
        const result = response.body;
        expect(result.error).toContain('Valid employee email is required');
    });
});