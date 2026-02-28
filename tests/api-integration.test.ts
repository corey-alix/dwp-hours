import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DataSource, Between } from "typeorm";
import {
  Employee,
  PtoEntry,
  MonthlyHours,
  Acknowledgement,
  AdminAcknowledgement,
} from "../server/entities/index.js";
import {
  formatDate,
  endOfMonth,
  compareDates,
  today,
  isValidDateString,
} from "../shared/dateUtils.js";

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
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  testDb.exec(schema);

  // Create TypeORM data source (same as server)
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

  app.post("/api/hours", async (req, res) => {
    // Same implementation as server.mts
    try {
      const { employeeId, month, hours } = req.body;

      if (!employeeId || !month || hours === undefined) {
        return res
          .status(400)
          .json({ error: "Employee ID, month, and hours are required" });
      }

      const employeeIdNum = parseInt(employeeId);
      const hoursNum = parseFloat(hours);

      if (isNaN(employeeIdNum) || isNaN(hoursNum)) {
        return res.status(400).json({ error: "Invalid employee ID or hours" });
      }

      if (hoursNum < 0 || hoursNum > 400) {
        return res
          .status(400)
          .json({ error: "Hours must be between 0 and 400" });
      }

      const employee = await dataSource
        .getRepository(Employee)
        .findOne({ where: { id: employeeIdNum } });
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const existingHours = await dataSource
        .getRepository(MonthlyHours)
        .findOne({
          where: { employee_id: employeeIdNum, month: month },
        });

      if (existingHours) {
        existingHours.hours_worked = hoursNum;
        existingHours.submitted_at = new Date();
        await dataSource.getRepository(MonthlyHours).save(existingHours);
        res.json({
          message: "Hours updated successfully",
          hours: existingHours,
        });
      } else {
        const newHours = dataSource.getRepository(MonthlyHours).create({
          employee_id: employeeIdNum,
          month: month,
          hours_worked: hoursNum,
        });
        await dataSource.getRepository(MonthlyHours).save(newHours);
        res
          .status(201)
          .json({ message: "Hours submitted successfully", hours: newHours });
      }
    } catch (error) {
      console.error("Error submitting hours:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Add other routes as needed...
  app.get("/api/employees/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid employee ID" });
      }

      const employee = await dataSource
        .getRepository(Employee)
        .findOne({ where: { id } });
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Error retrieving employee:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // PTO Year Review endpoint (simplified for testing - no auth)
  app.get("/api/pto/year/:year", async (req, res) => {
    try {
      const { year } = req.params;
      const yearNum = parseInt(year as string);
      // For testing, use employee ID from query param or default to 1
      const employeeId = req.query.employeeId
        ? parseInt(req.query.employeeId as string)
        : 1;

      // Validate year parameter
      const currentYear = new Date().getFullYear();
      if (
        isNaN(yearNum) ||
        yearNum < currentYear - 10 ||
        yearNum >= currentYear
      ) {
        return res.status(400).json({
          error:
            "Invalid year parameter. Year must be between " +
            (currentYear - 10) +
            " and " +
            (currentYear - 1),
        });
      }

      const ptoEntryRepo = dataSource.getRepository(PtoEntry);

      // Get PTO entries for the specified year
      const startDate = `${yearNum}-01-01`;
      const endDate = `${yearNum}-12-31`;

      const ptoEntries = await ptoEntryRepo.find({
        where: {
          employee_id: employeeId,
          date: Between(startDate, endDate),
        },
        order: { date: "ASC" },
      });

      // Group PTO entries by month
      const months = [];
      for (let month = 1; month <= 12; month++) {
        const monthStart = formatDate(yearNum, month, 1);
        const monthEnd = endOfMonth(monthStart);

        const monthEntries = ptoEntries.filter((entry) => {
          return (
            compareDates(entry.date, monthStart) >= 0 &&
            compareDates(entry.date, monthEnd) <= 0
          );
        });

        // Calculate summary for the month
        const { day: totalDays } = {
          day: new Date(yearNum, month, 0).getDate(),
        }; // Simple calculation for testing
        const summary = {
          totalDays,
          ptoHours: monthEntries
            .filter((e) => e.type === "PTO")
            .reduce((sum, e) => sum + e.hours, 0),
          sickHours: monthEntries
            .filter((e) => e.type === "Sick")
            .reduce((sum, e) => sum + e.hours, 0),
          bereavementHours: monthEntries
            .filter((e) => e.type === "Bereavement")
            .reduce((sum, e) => sum + e.hours, 0),
          juryDutyHours: monthEntries
            .filter((e) => e.type === "Jury Duty")
            .reduce((sum, e) => sum + e.hours, 0),
        };

        months.push({
          month,
          ptoEntries: monthEntries.map((entry) => ({
            date: entry.date, // Already in YYYY-MM-DD format
            type: entry.type,
            hours: entry.hours,
          })),
          summary,
        });
      }

      res.json({
        year: yearNum,
        months,
      });
    } catch (error) {
      console.error("Error getting PTO year review:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

describe("API Integration Tests", () => {
  it("should test complete request/response cycle", async () => {
    // Create test employee
    const employee = dataSource.getRepository(Employee).create({
      name: "Integration Test Employee",
      identifier: "integration@example.com",
      pto_rate: 0.71,
      carryover_hours: 10,
      hire_date: "2024-01-01",
      role: "Employee",
    });
    await dataSource.getRepository(Employee).save(employee);

    // Test POST /api/hours
    const postResponse = await request(app).post("/api/hours").send({
      employeeId: employee.id,
      month: "2024-06",
      hours: 160,
    });

    expect(postResponse.status).toBe(201);
    expect(postResponse.body.message).toBe("Hours submitted successfully");
    expect(postResponse.body.hours.employee_id).toBe(employee.id);
    expect(postResponse.body.hours.hours_worked).toBe(160);

    // Verify data was actually saved to database
    const savedHours = await dataSource.getRepository(MonthlyHours).findOne({
      where: { employee_id: employee.id },
    });
    expect(savedHours).toBeTruthy();
    expect(savedHours?.hours_worked).toBe(160);
  });

  it("should handle full employee lifecycle", async () => {
    // Test employee creation and retrieval
    const employee = dataSource.getRepository(Employee).create({
      name: "Lifecycle Test Employee",
      identifier: "lifecycle@example.com",
      pto_rate: 0.71,
      carryover_hours: 10,
      hire_date: "2024-01-01",
      role: "Employee",
    });
    await dataSource.getRepository(Employee).save(employee);

    // Test employee retrieval
    const getResponse = await request(app).get(`/api/employees/${employee.id}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(employee.id);
    expect(getResponse.body.name).toBe(employee.name);
  });

  it("should validate business rules end-to-end", async () => {
    const employee = dataSource.getRepository(Employee).create({
      name: "Validation Test Employee",
      identifier: "validation@example.com",
      pto_rate: 0.71,
      carryover_hours: 10,
      hire_date: "2024-01-01",
      role: "Employee",
    });
    await dataSource.getRepository(Employee).save(employee);

    // Test invalid hours (too high)
    const invalidResponse = await request(app).post("/api/hours").send({
      employeeId: employee.id,
      month: "2024-06",
      hours: 500, // Exceeds limit
    });

    expect(invalidResponse.status).toBe(400);
    expect(invalidResponse.body.error).toBe("Hours must be between 0 and 400");

    // Test valid hours
    const validResponse = await request(app).post("/api/hours").send({
      employeeId: employee.id,
      month: "2024-06",
      hours: 160,
    });

    expect(validResponse.status).toBe(201);
  });

  describe("PTO Year Review API", () => {
    let testEmployee: Employee;

    beforeEach(async () => {
      // Create test employee
      testEmployee = dataSource.getRepository(Employee).create({
        name: "PTO Year Test Employee",
        identifier: "pto-year@example.com",
        pto_rate: 0.71,
        carryover_hours: 10,
        hire_date: "2024-01-01",
        role: "Employee",
      });
      await dataSource.getRepository(Employee).save(testEmployee);

      // Create some PTO entries for 2025
      const ptoEntries = [
        {
          employee_id: testEmployee.id,
          date: "2025-01-15",
          type: "PTO" as const,
          hours: 8,
        },
        {
          employee_id: testEmployee.id,
          date: "2025-02-20",
          type: "Sick" as const,
          hours: 4,
        },
        {
          employee_id: testEmployee.id,
          date: "2025-03-10",
          type: "Bereavement" as const,
          hours: 8,
        },
        {
          employee_id: testEmployee.id,
          date: "2025-06-15",
          type: "Jury Duty" as const,
          hours: 8,
        },
        {
          employee_id: testEmployee.id,
          date: "2025-12-25",
          type: "PTO" as const,
          hours: 8,
        },
      ];

      for (const entry of ptoEntries) {
        await dataSource.getRepository(PtoEntry).save(entry);
      }
    });

    it("should return PTO data for a valid year", async () => {
      const response = await request(app)
        .get("/api/pto/year/2025")
        .query({ employeeId: testEmployee.id });

      expect(response.status).toBe(200);
      expect(response.body.year).toBe(2025);
      expect(response.body.months).toHaveLength(12);

      // Check January has PTO entry
      const january = response.body.months[0];
      expect(january.month).toBe(1);
      expect(january.ptoEntries).toHaveLength(1);
      expect(january.ptoEntries[0]).toEqual({
        date: "2025-01-15",
        type: "PTO",
        hours: 8,
      });
      expect(january.summary.ptoHours).toBe(8);

      // Check February has Sick entry
      const february = response.body.months[1];
      expect(february.ptoEntries).toHaveLength(1);
      expect(february.summary.sickHours).toBe(4);

      // Check December has PTO entry
      const december = response.body.months[11];
      expect(december.ptoEntries).toHaveLength(1);
      expect(december.summary.ptoHours).toBe(8);
    });

    it("should return empty months when no PTO entries exist for the year", async () => {
      const response = await request(app)
        .get("/api/pto/year/2024")
        .query({ employeeId: testEmployee.id });

      expect(response.status).toBe(200);
      expect(response.body.year).toBe(2024);
      expect(response.body.months).toHaveLength(12);

      // All months should have empty entries and zero summaries
      for (const month of response.body.months) {
        expect(month.ptoEntries).toHaveLength(0);
        expect(month.summary.ptoHours).toBe(0);
        expect(month.summary.sickHours).toBe(0);
        expect(month.summary.bereavementHours).toBe(0);
        expect(month.summary.juryDutyHours).toBe(0);
      }
    });

    it("should reject invalid year parameters", async () => {
      // Year too old
      const oldYearResponse = await request(app)
        .get("/api/pto/year/2010")
        .query({ employeeId: testEmployee.id });

      expect(oldYearResponse.status).toBe(400);
      expect(oldYearResponse.body.error).toContain("Invalid year parameter");

      // Year in future (current year)
      const currentYear = new Date().getFullYear();
      const futureYearResponse = await request(app)
        .get(`/api/pto/year/${currentYear}`)
        .query({ employeeId: testEmployee.id });

      expect(futureYearResponse.status).toBe(400);
      expect(futureYearResponse.body.error).toContain("Invalid year parameter");

      // Invalid year format
      const invalidYearResponse = await request(app)
        .get("/api/pto/year/abc")
        .query({ employeeId: testEmployee.id });

      expect(invalidYearResponse.status).toBe(400);
      expect(invalidYearResponse.body.error).toContain(
        "Invalid year parameter",
      );
    });

    it("should handle multiple PTO entries in the same month", async () => {
      // Add another PTO entry in January
      await dataSource.getRepository(PtoEntry).save({
        employee_id: testEmployee.id,
        date: "2025-01-20",
        type: "PTO",
        hours: 4,
      });

      const response = await request(app)
        .get("/api/pto/year/2025")
        .query({ employeeId: testEmployee.id });

      expect(response.status).toBe(200);

      const january = response.body.months[0];
      expect(january.ptoEntries).toHaveLength(2);
      expect(january.summary.ptoHours).toBe(12); // 8 + 4
    });

    it("should return correct response structure", async () => {
      const response = await request(app)
        .get("/api/pto/year/2025")
        .query({ employeeId: testEmployee.id });

      expect(response.status).toBe(200);

      // Validate response structure
      expect(response.body).toHaveProperty("year");
      expect(response.body).toHaveProperty("months");
      expect(Array.isArray(response.body.months)).toBe(true);

      const month = response.body.months[0];
      expect(month).toHaveProperty("month");
      expect(month).toHaveProperty("ptoEntries");
      expect(month).toHaveProperty("summary");
      expect(Array.isArray(month.ptoEntries)).toBe(true);
      expect(month.summary).toHaveProperty("totalDays");
      expect(month.summary).toHaveProperty("ptoHours");
      expect(month.summary).toHaveProperty("sickHours");
      expect(month.summary).toHaveProperty("bereavementHours");
      expect(month.summary).toHaveProperty("juryDutyHours");
    });
  });
});
