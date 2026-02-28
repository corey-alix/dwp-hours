import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DataSource } from "typeorm";
import {
  Employee,
  PtoEntry,
  MonthlyHours,
  Acknowledgement,
  AdminAcknowledgement,
} from "../server/entities/index.js";
import { PtoEntryDAL } from "../server/dal/PtoEntryDAL.js";

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
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  testDb.exec(schema);

  // Create TypeORM data source
  dataSource = new DataSource({
    type: "sqljs",
    database: new Uint8Array(testDb.export()),
    entities: [
      Employee,
      PtoEntry,
      MonthlyHours,
      Acknowledgement,
      AdminAcknowledgement,
    ],
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
    name: "Test Employee",
    identifier: "TEST001",
    pto_rate: 0.71,
    carryover_hours: 0,
    hire_date: "2023-01-01",
    role: "Employee",
  });
});

describe("PtoEntryDAL", () => {
  describe("validatePtoEntryData", () => {
    it("should validate correct data", async () => {
      const data = {
        employeeId: 1,
        date: "2024-02-05", // Monday
        hours: 8,
        type: "PTO",
      };

      const errors = await dal.validatePtoEntryData(data);
      expect(errors).toHaveLength(0);
    });

    it("should accept weekend dates (no longer rejected)", async () => {
      const data = {
        employeeId: 1,
        date: "2024-01-06", // Saturday
        hours: 8,
        type: "PTO",
      };

      const errors = await dal.validatePtoEntryData(data);
      // Weekend dates are now permitted (make-up time)
      expect(
        errors.filter((e) => e.messageKey === "date.weekday"),
      ).toHaveLength(0);
    });

    it("should accept non-increment hours", async () => {
      const data = {
        employeeId: 1,
        date: "2024-01-08",
        hours: 6,
        type: "PTO",
      };

      const errors = await dal.validatePtoEntryData(data);
      expect(
        errors.filter((e) => e.messageKey === "hours.invalid"),
      ).toHaveLength(0);
    });

    it("should reject duplicate entries", async () => {
      // Create employee first
      const employeeRepo = dataSource.getRepository(Employee);
      await employeeRepo.save({
        id: 1,
        name: "Test Employee",
        identifier: "test@example.com",
        ptoRate: 0.05,
        carryoverHours: 0,
        hireDate: new Date("2020-01-01"),
        role: "Employee",
      });

      // First create an entry
      const result1 = await dal.createPtoEntry({
        employeeId: 1,
        date: "2024-02-05",
        hours: 8,
        type: "PTO",
      });
      expect(result1.success).toBe(true);

      // Try to create another with same employee, date, type
      const data = {
        employeeId: 1,
        date: "2024-02-05",
        hours: 4,
        type: "PTO",
      };

      const errors = await dal.validatePtoEntryData(data);
      expect(errors).toHaveLength(1);
      expect(errors[0].messageKey).toBe("pto.duplicate");
    });

    it("should allow different types on same day", async () => {
      // Create PTO entry
      await dal.createPtoEntry({
        employeeId: 1,
        date: "2024-02-05",
        hours: 8,
        type: "PTO",
      });

      // Should allow Sick on same day
      const data = {
        employeeId: 1,
        date: "2024-02-05",
        hours: 4,
        type: "Sick",
      };

      const errors = await dal.validatePtoEntryData(data);
      expect(errors).toHaveLength(0);
    });

    it("should reject PTO request exceeding available balance", async () => {
      // Create an employee with limited remaining PTO balance
      // Tier-0 rate (0.65) × ~261 workdays ≈ 170 hours annual allocation
      const employeeRepo = dataSource.getRepository(Employee);
      await employeeRepo.save({
        id: 2,
        name: "Limited PTO Employee",
        identifier: "LIMITED001",
        pto_rate: 0.65, // Tier-0 daily rate from PTO_EARNING_SCHEDULE
        carryover_hours: 0,
        hire_date: "2024-01-01",
        role: "Employee",
      });

      // Insert PTO entry directly to bypass balance validation,
      // using up most of the ~170-hour allocation
      const ptoEntryRepo = dataSource.getRepository(PtoEntry);
      await ptoEntryRepo.save({
        employee_id: 2,
        date: "2024-02-03", // Monday
        hours: 165, // Use up most PTO, leaving ~5 hours
        type: "PTO",
      });

      // Now try to request 8 hours when only ~5 are available
      const data = {
        employeeId: 2,
        date: "2024-02-05",
        hours: 8,
        type: "PTO",
      };

      const errors = await dal.validatePtoEntryData(data);
      expect(errors).toHaveLength(1);
      expect(errors[0].messageKey).toBe("hours.exceed_pto_balance");
    });

    it("should allow PTO request within available balance", async () => {
      // Create an employee with sufficient PTO balance
      const employeeRepo = dataSource.getRepository(Employee);
      await employeeRepo.save({
        id: 3,
        name: "Sufficient PTO Employee",
        identifier: "SUFFICIENT001",
        pto_rate: 0.71, // Standard accrual rate (~186h/year)
        carryover_hours: 0,
        hire_date: "2024-01-01",
        role: "Employee",
      });

      // Use some PTO, leaving plenty available (~170h remaining)
      await dal.createPtoEntry({
        employeeId: 3,
        date: "2024-02-01",
        hours: 16,
        type: "PTO",
      });

      // Request 8 hours when ~170 are available
      const data = {
        employeeId: 3,
        date: "2024-02-05",
        hours: 8,
        type: "PTO",
      };

      const errors = await dal.validatePtoEntryData(data);
      if (errors.length > 0) {
        console.log("Errors:", JSON.stringify(errors, null, 2));
      }
      expect(errors).toHaveLength(0);
    });

    it("should allow PTO request exactly matching available balance", async () => {
      // Create an employee with exact PTO balance
      // pto_rate: 0.5 * 262 work days = 131 + 1 carryover = 132 total (exact in floating point)
      const employeeRepo = dataSource.getRepository(Employee);
      await employeeRepo.save({
        id: 4,
        name: "Exact PTO Employee",
        identifier: "EXACT001",
        pto_rate: 0.5,
        carryover_hours: 1,
        hire_date: "2024-01-01",
        role: "Employee",
      });

      // Use PTO to leave exactly 8 hours available (132 - 124 = 8)
      await dal.createPtoEntry({
        employeeId: 4,
        date: "2024-02-01",
        hours: 124,
        type: "PTO",
      });

      // Request exactly 8 hours (matches remaining balance)
      const data = {
        employeeId: 4,
        date: "2024-02-05",
        hours: 8,
        type: "PTO",
      };

      const errors = await dal.validatePtoEntryData(data);
      expect(errors).toHaveLength(0);
    });

    it("should not validate PTO balance for non-PTO types", async () => {
      // Create an employee with nearly exhausted PTO balance
      const employeeRepo = dataSource.getRepository(Employee);
      await employeeRepo.save({
        id: 5,
        name: "No PTO Employee",
        identifier: "NOPTO001",
        pto_rate: 0.65, // Tier-0 daily rate from PTO_EARNING_SCHEDULE
        carryover_hours: 0,
        hire_date: "2024-01-01",
        role: "Employee",
      });

      // Insert PTO entry directly to bypass balance validation
      const ptoEntryRepo = dataSource.getRepository(PtoEntry);
      await ptoEntryRepo.save({
        employee_id: 5,
        date: "2024-02-03", // Monday
        hours: 165,
        type: "PTO",
      });

      // Should allow Sick time even with nearly exhausted PTO balance
      const data = {
        employeeId: 5,
        date: "2024-02-05",
        hours: 8,
        type: "Sick",
      };

      const errors = await dal.validatePtoEntryData(data);
      expect(errors).toHaveLength(0);
    });
  });

  describe("createPtoEntry", () => {
    it("should create valid PTO entry", async () => {
      const data = {
        employeeId: 1,
        date: "2024-02-05",
        hours: 8,
        type: "PTO",
      };

      const result = await dal.createPtoEntry(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ptoEntry).toBeDefined();
        expect(result.ptoEntry.type).toBe("PTO");
        expect(result.ptoEntry.hours).toBe(8);
      }
    });

    it("should reject invalid data", async () => {
      const data = {
        employeeId: 1,
        date: "2024-01-08", // Monday
        hours: 0, // Zero hours is invalid
        type: "PTO",
      };

      const result = await dal.createPtoEntry(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("should prevent PTO creation when balance is insufficient", async () => {
      // Create an employee with limited remaining PTO balance
      // Tier-0 rate (0.65) × ~261 workdays ≈ 170 hours annual allocation
      const employeeRepo = dataSource.getRepository(Employee);
      await employeeRepo.save({
        id: 6,
        name: "Blocked PTO Employee",
        identifier: "BLOCKED001",
        pto_rate: 0.65, // Tier-0 daily rate from PTO_EARNING_SCHEDULE
        carryover_hours: 0,
        hire_date: "2024-01-01",
        role: "Employee",
      });

      // Insert PTO entry directly to bypass balance validation,
      // using up most of the ~170-hour allocation
      const ptoEntryRepo = dataSource.getRepository(PtoEntry);
      await ptoEntryRepo.save({
        employee_id: 6,
        date: "2024-02-03", // Monday
        hours: 165,
        type: "PTO",
      });

      const data = {
        employeeId: 6,
        date: "2024-02-05",
        hours: 8, // Requesting more than available (~5 left)
        type: "PTO",
      };

      const result = await dal.createPtoEntry(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].messageKey).toBe("hours.exceed_pto_balance");
      }
    });

    it("should allow PTO creation when balance is sufficient", async () => {
      // Create an employee with sufficient PTO balance
      const employeeRepo = dataSource.getRepository(Employee);
      await employeeRepo.save({
        id: 7,
        name: "Allowed PTO Employee",
        identifier: "ALLOWED001",
        pto_rate: 0.71, // Standard accrual rate (~186h/year)
        carryover_hours: 0,
        hire_date: "2024-01-01",
        role: "Employee",
      });

      // Use some PTO (~170 remaining)
      await dal.createPtoEntry({
        employeeId: 7,
        date: "2024-02-01",
        hours: 16,
        type: "PTO",
      });

      const data = {
        employeeId: 7,
        date: "2024-02-05",
        hours: 8, // ~170 hours still available
        type: "PTO",
      };

      const result = await dal.createPtoEntry(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.ptoEntry.hours).toBe(8);
        expect(result.ptoEntry.type).toBe("PTO");
      }
    });
  });

  describe("updatePtoEntry", () => {
    it("should update existing entry", async () => {
      // Create entry
      const createResult = await dal.createPtoEntry({
        employeeId: 1,
        date: "2024-02-05",
        hours: 8,
        type: "PTO",
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

    it("should reject invalid update", async () => {
      // Create entry
      const createResult = await dal.createPtoEntry({
        employeeId: 1,
        date: "2024-02-05",
        hours: 8,
        type: "PTO",
      });
      expect(createResult.success).toBe(true);
      if (!createResult.success) return;
      const entryId = createResult.ptoEntry.id;

      // Try to update to zero hours (invalid)
      const updateResult = await dal.updatePtoEntry(entryId, {
        hours: 0,
      });
      expect(updateResult.success).toBe(false);
      if (!updateResult.success) {
        expect(updateResult.errors.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe("getPtoEntries", () => {
    it("should retrieve entries for employee", async () => {
      await dal.createPtoEntry({
        employeeId: 1,
        date: "2024-02-05",
        hours: 8,
        type: "PTO",
      });

      const entries = await dal.getPtoEntries(1);
      expect(entries).toHaveLength(1);
      expect(entries[0].type).toBe("PTO");
    });
  });
});
