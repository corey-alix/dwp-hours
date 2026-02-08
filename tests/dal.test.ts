import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DataSource } from 'typeorm';
import { Employee, PtoEntry, MonthlyHours, Acknowledgement, AdminAcknowledgement } from '../server/entities/index.js';
import { PtoEntryDAL } from '../server/dal/PtoEntryDAL.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testDb: initSqlJs.Database;
let dataSource: DataSource;
let dal: PtoEntryDAL;

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
});

afterAll(async () => {
    await dataSource.destroy();
});

beforeEach(async () => {
    // Clear tables
    await dataSource.getRepository(PtoEntry).clear();
    await dataSource.getRepository(Employee).clear();

    // Insert test employee
    const employeeRepo = dataSource.getRepository(Employee);
    await employeeRepo.save({
        id: 1,
        name: 'Test Employee',
        identifier: 'TEST001',
        pto_rate: 0.71,
        carryover_hours: 0,
        hire_date: new Date('2023-01-01'),
        role: 'Employee'
    });
});

describe('PtoEntryDAL', () => {
    describe('validatePtoEntryData', () => {
        it('should validate correct data', async () => {
            const data = {
                employeeId: 1,
                date: '2024-02-05', // Monday
                hours: 8,
                type: 'PTO'
            };

            const errors = await dal.validatePtoEntryData(data);
            expect(errors).toHaveLength(0);
        });

        it('should reject weekend dates', async () => {
            const data = {
                employeeId: 1,
                date: '2024-01-06', // Saturday
                hours: 8,
                type: 'PTO'
            };

            const errors = await dal.validatePtoEntryData(data);
            expect(errors).toHaveLength(1);
            expect(errors[0].messageKey).toBe('date.weekday');
        });

        it('should reject invalid hours', async () => {
            const data = {
                employeeId: 1,
                date: '2024-01-08',
                hours: 6,
                type: 'PTO'
            };

            const errors = await dal.validatePtoEntryData(data);
            expect(errors).toHaveLength(1);
            expect(errors[0].messageKey).toBe('hours.invalid');
        });

        it('should reject duplicate entries', async () => {
            // Create employee first
            const employeeRepo = dataSource.getRepository(Employee);
            await employeeRepo.save({
                id: 1,
                name: 'Test Employee',
                identifier: 'test@example.com',
                ptoRate: 0.05,
                carryoverHours: 0,
                hireDate: new Date('2020-01-01'),
                role: 'Employee'
            });

            // First create an entry
            const result1 = await dal.createPtoEntry({
                employeeId: 1,
                date: '2024-02-05',
                hours: 8,
                type: 'PTO'
            });
            expect(result1.success).toBe(true);

            // Try to create another with same employee, date, type
            const data = {
                employeeId: 1,
                date: '2024-02-05',
                hours: 4,
                type: 'PTO'
            };

            const errors = await dal.validatePtoEntryData(data);
            expect(errors).toHaveLength(1);
            expect(errors[0].messageKey).toBe('pto.duplicate');
        });

        it('should allow different types on same day', async () => {
            // Create PTO entry
            await dal.createPtoEntry({
                employeeId: 1,
                date: '2024-02-05',
                hours: 8,
                type: 'PTO'
            });

            // Should allow Sick on same day
            const data = {
                employeeId: 1,
                date: '2024-02-05',
                hours: 4,
                type: 'Sick'
            };

            const errors = await dal.validatePtoEntryData(data);
            expect(errors).toHaveLength(0);
        });

        it('should reject PTO request exceeding available balance', async () => {
            // Create an employee with limited PTO balance
            const employeeRepo = dataSource.getRepository(Employee);
            await employeeRepo.save({
                id: 2,
                name: 'Limited PTO Employee',
                identifier: 'LIMITED001',
                pto_rate: 0, // No accrual
                carryover_hours: 0, // No carryover
                hire_date: new Date('2024-01-01'), // Hired this year
                role: 'Employee'
            });

            // For a hire in January 2024, they get prorated allocation
            // January hire gets 12/12 = 96 hours, but let's use up most of it
            // First, create existing PTO entries that use up 92 hours, leaving 4 available
            await dal.createPtoEntry({
                employeeId: 2,
                date: '2024-02-01',
                hours: 92, // Use up most PTO
                type: 'PTO'
            });

            // Now try to request 8 hours when only 4 are available
            const data = {
                employeeId: 2,
                date: '2024-02-05',
                hours: 8,
                type: 'PTO'
            };

            const errors = await dal.validatePtoEntryData(data);
            expect(errors).toHaveLength(1);
            expect(errors[0].messageKey).toBe('hours.exceed_pto_balance');
        });

        it('should allow PTO request within available balance', async () => {
            // Create an employee with sufficient PTO balance
            const employeeRepo = dataSource.getRepository(Employee);
            await employeeRepo.save({
                id: 3,
                name: 'Sufficient PTO Employee',
                identifier: 'SUFFICIENT001',
                pto_rate: 0,
                carryover_hours: 0,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });

            // Use some PTO, leaving plenty available
            await dal.createPtoEntry({
                employeeId: 3,
                date: '2024-02-01',
                hours: 16,
                type: 'PTO'
            });

            // Request 8 hours when 80 are available (96 - 16 = 80)
            const data = {
                employeeId: 3,
                date: '2024-02-05',
                hours: 8,
                type: 'PTO'
            };

            const errors = await dal.validatePtoEntryData(data);
            expect(errors).toHaveLength(0);
        });

        it('should allow PTO request exactly matching available balance', async () => {
            // Create an employee with exact PTO balance
            const employeeRepo = dataSource.getRepository(Employee);
            await employeeRepo.save({
                id: 4,
                name: 'Exact PTO Employee',
                identifier: 'EXACT001',
                pto_rate: 0,
                carryover_hours: 0,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });

            // Use PTO to leave exactly 8 hours available
            await dal.createPtoEntry({
                employeeId: 4,
                date: '2024-02-01',
                hours: 88, // 96 - 88 = 8 remaining
                type: 'PTO'
            });

            // Request exactly 8 hours
            const data = {
                employeeId: 4,
                date: '2024-02-05',
                hours: 8,
                type: 'PTO'
            };

            const errors = await dal.validatePtoEntryData(data);
            expect(errors).toHaveLength(0);
        });

        it('should not validate PTO balance for non-PTO types', async () => {
            // Create an employee with no PTO balance
            const employeeRepo = dataSource.getRepository(Employee);
            await employeeRepo.save({
                id: 5,
                name: 'No PTO Employee',
                identifier: 'NOPTO001',
                pto_rate: 0,
                carryover_hours: 0,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });

            // Use up all PTO
            await dal.createPtoEntry({
                employeeId: 5,
                date: '2024-02-01',
                hours: 96,
                type: 'PTO'
            });

            // Should allow Sick time even with no PTO balance
            const data = {
                employeeId: 5,
                date: '2024-02-05',
                hours: 8,
                type: 'Sick'
            };

            const errors = await dal.validatePtoEntryData(data);
            expect(errors).toHaveLength(0);
        });
    });

    describe('createPtoEntry', () => {
        it('should create valid PTO entry', async () => {
            const data = {
                employeeId: 1,
                date: '2024-02-05',
                hours: 8,
                type: 'PTO'
            };

            const result = await dal.createPtoEntry(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.ptoEntry).toBeDefined();
                expect(result.ptoEntry.type).toBe('PTO');
                expect(result.ptoEntry.hours).toBe(8);
            }
        });

        it('should reject invalid data', async () => {
            const data = {
                employeeId: 1,
                date: '2024-01-06', // Saturday
                hours: 8,
                type: 'PTO'
            };

            const result = await dal.createPtoEntry(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors).toHaveLength(1);
            }
        });

        it('should prevent PTO creation when balance is insufficient', async () => {
            // Create an employee with limited PTO balance
            const employeeRepo = dataSource.getRepository(Employee);
            await employeeRepo.save({
                id: 6,
                name: 'Blocked PTO Employee',
                identifier: 'BLOCKED001',
                pto_rate: 0,
                carryover_hours: 0,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });

            // Use up most PTO
            await dal.createPtoEntry({
                employeeId: 6,
                date: '2024-02-01',
                hours: 92,
                type: 'PTO'
            });

            const data = {
                employeeId: 6,
                date: '2024-02-05',
                hours: 8, // Requesting more than available (only 4 left)
                type: 'PTO'
            };

            const result = await dal.createPtoEntry(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.errors).toHaveLength(1);
                expect(result.errors[0].messageKey).toBe('hours.exceed_pto_balance');
            }
        });

        it('should allow PTO creation when balance is sufficient', async () => {
            // Create an employee with sufficient PTO balance
            const employeeRepo = dataSource.getRepository(Employee);
            await employeeRepo.save({
                id: 7,
                name: 'Allowed PTO Employee',
                identifier: 'ALLOWED001',
                pto_rate: 0,
                carryover_hours: 0,
                hire_date: new Date('2024-01-01'),
                role: 'Employee'
            });

            // Use some PTO
            await dal.createPtoEntry({
                employeeId: 7,
                date: '2024-02-01',
                hours: 16,
                type: 'PTO'
            });

            const data = {
                employeeId: 7,
                date: '2024-02-05',
                hours: 8, // 80 hours still available
                type: 'PTO'
            };

            const result = await dal.createPtoEntry(data);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.ptoEntry.hours).toBe(8);
                expect(result.ptoEntry.type).toBe('PTO');
            }
        });
    });

    describe('updatePtoEntry', () => {
        it('should update existing entry', async () => {
            // Create entry
            const createResult = await dal.createPtoEntry({
                employeeId: 1,
                date: '2024-02-05',
                hours: 8,
                type: 'PTO'
            });
            expect(createResult.success).toBe(true);
            if (!createResult.success) return;
            const entryId = createResult.ptoEntry.id;

            // Update it
            const updateResult = await dal.updatePtoEntry(entryId, { hours: 4 });
            expect(updateResult.success).toBe(true);
            if (updateResult.success) {
                expect(updateResult.ptoEntry.hours).toBe(4);
            }
        });

        it('should reject invalid update', async () => {
            // Create entry
            const createResult = await dal.createPtoEntry({
                employeeId: 1,
                date: '2024-02-05',
                hours: 8,
                type: 'PTO'
            });
            expect(createResult.success).toBe(true);
            if (!createResult.success) return;
            const entryId = createResult.ptoEntry.id;

            // Try to update to weekend
            const updateResult = await dal.updatePtoEntry(entryId, { date: '2024-01-06' });
            expect(updateResult.success).toBe(false);
            if (!updateResult.success) {
                expect(updateResult.errors).toHaveLength(1);
            }
        });
    });

    describe('getPtoEntries', () => {
        it('should retrieve entries for employee', async () => {
            await dal.createPtoEntry({
                employeeId: 1,
                date: '2024-02-05',
                hours: 8,
                type: 'PTO'
            });

            const entries = await dal.getPtoEntries(1);
            expect(entries).toHaveLength(1);
            expect(entries[0].type).toBe('PTO');
        });
    });
});