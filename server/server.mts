import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { body, validationResult } from "express-validator";
import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import "reflect-metadata";
import { DataSource, Not, IsNull, Between, Like } from "typeorm";
import {
  Employee,
  PtoEntry,
  MonthlyHours,
  Acknowledgement,
  AdminAcknowledgement,
} from "./entities/index.js";
import { calculatePTOStatus } from "./ptoCalculations.js";
import { getTotalWorkDaysInYear } from "./workDays.js";
import {
  dateToString,
  getDateComponents,
  formatDate,
  endOfMonth,
  compareDates,
  isValidDateString,
  today,
} from "../shared/dateUtils.js";
import net from "net";
import { sendMagicLinkEmail } from "./utils/mailer.js";
import { PtoEntryDAL } from "./dal/PtoEntryDAL.js";
import {
  VALIDATION_MESSAGES,
  SUCCESS_MESSAGES,
  BUSINESS_RULES_CONSTANTS,
  MessageKey,
  validatePTOBalance,
} from "../shared/businessRules.js";
import { BACKUP_CONFIG } from "../shared/backupConfig.js";
import {
  backupMiddleware,
  initBackupSystem,
  getBackupStatus,
  validateBackupFilename,
  restoreFromBackup,
} from "./backup.js";
import { performBulkMigration, performFileMigration } from "./bulkMigration.js";
import { authenticate, authenticateAdmin } from "./utils/auth.js";
import { seedEmployees, seedPTOEntries } from "../shared/seedData.js";
import type {
  PTOCreateResponse,
  PTOUpdateResponse,
  EmployeeCreateResponse,
  EmployeeUpdateResponse,
  HoursSubmitResponse,
  AcknowledgementSubmitResponse,
  AdminAcknowledgementSubmitResponse,
  AdminMonthlyReviewItem,
  EmployeeCreateRequest,
  EmployeeUpdateRequest,
  PTOCreateRequest,
  PTOBulkCreateRequest,
  PTOUpdateRequest,
} from "../shared/api-models.js";
import {
  serializePTOEntry,
  serializeEmployee,
  serializeMonthlyHours,
  serializeAcknowledgement,
  serializeAdminAcknowledgement,
} from "../shared/entity-transforms.js";
import { logger, log } from "../shared/logger.js";

// Type guard functions for runtime validation
function isEmployeeCreateRequest(obj: any): obj is EmployeeCreateRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.name === "string" &&
    typeof obj.identifier === "string" &&
    typeof obj.ptoRate === "number" &&
    typeof obj.carryoverHours === "number" &&
    typeof obj.hireDate === "string" &&
    typeof obj.role === "string"
  );
}

function isEmployeeUpdateRequest(obj: any): obj is EmployeeUpdateRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (obj.name === undefined || typeof obj.name === "string") &&
    (obj.identifier === undefined || typeof obj.identifier === "string") &&
    (obj.ptoRate === undefined || typeof obj.ptoRate === "number") &&
    (obj.carryoverHours === undefined ||
      typeof obj.carryoverHours === "number") &&
    (obj.hireDate === undefined || typeof obj.hireDate === "string") &&
    (obj.role === undefined || typeof obj.role === "string")
  );
}

function isPTOCreateRequest(obj: any): obj is PTOCreateRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.date === "string" &&
    typeof obj.hours === "number" &&
    typeof obj.type === "string"
  );
}

function isPTOBulkCreateRequest(obj: any): obj is PTOBulkCreateRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    Array.isArray(obj.requests) &&
    obj.requests.every(isPTOCreateRequest)
  );
}

function isPTOUpdateRequest(obj: any): obj is PTOUpdateRequest {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (obj.date === undefined || typeof obj.date === "string") &&
    (obj.hours === undefined || typeof obj.hours === "number") &&
    (obj.type === undefined || typeof obj.type === "string") &&
    (obj.approved_by === undefined ||
      obj.approved_by === null ||
      typeof obj.approved_by === "number")
  );
}

function isHoursSubmitRequest(
  obj: any,
): obj is { month: string; hours: number | string } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.month === "string" &&
    (typeof obj.hours === "number" ||
      (typeof obj.hours === "string" && !isNaN(parseFloat(obj.hours))))
  );
}

function isAcknowledgementSubmitRequest(obj: any): obj is { month: string } {
  return (
    typeof obj === "object" && obj !== null && typeof obj.month === "string"
  );
}

function isAdminAcknowledgementSubmitRequest(
  obj: any,
): obj is { employeeId: string | number; month: string } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    (typeof obj.employeeId === "string" ||
      typeof obj.employeeId === "number") &&
    typeof obj.month === "string"
  );
}

function isFileMigrationRequest(
  obj: any,
): obj is { employeeEmail: string; filePath: string } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.employeeEmail === "string" &&
    typeof obj.filePath === "string"
  );
}

const VERSION = `1.0.0`; // INCREMENT BEFORE EACH CHANGE
const START_TIME = new Date().toISOString();

// running file
const runningFrom = process.argv[1];
// age of file
const fileStats = fs.statSync(runningFrom);
const FILE_AGE = Date.now() - fileStats.mtime.getTime();

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);

// Trust proxy to properly handle X-Forwarded-Proto header from nginx
app.set("trust proxy", true);

// Helper function to get base URL for magic links
function getBaseUrl(req: Request): string {
  // Check X-Forwarded-Proto header first (for proxies), then fall back to req.protocol
  const protocol = req.get("X-Forwarded-Proto") || req.protocol;
  const host = req.get("host");
  return `${protocol}://${host}`;
}

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Run backup checks after each response is sent (no user latency cost)
app.use(backupMiddleware);

// Logging middleware for static file access
app.use((req, res, next) => {
  if (req.path === "/index.html" || req.path === "/" || req.path === "") {
    logger.info(`Access to index.html from ${req.ip}`);
  }
  next();
});

// Logout endpoint (doesn't require database)
app.post("/api/auth/logout", (req, res) => {
  logger.info(`API access: ${req.method} ${req.path} by unauthenticated user`);
  logger.info(`User logout`);
  res.clearCookie("auth_hash", { path: "/" });
  res.json({ success: true });
});

// Serve static files from client directory in development mode
if (process.env.NODE_ENV !== "production") {
  app.use(express.static(path.join(process.cwd(), "client")));
}

// Serve static files from public directory
app.use(express.static(path.join(process.cwd(), "public")));

// Database setup
const DB_PATH = path.join(process.cwd(), BACKUP_CONFIG.DB_PATH);

// Check if port is in use
function checkPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, "127.0.0.1", () => {
      server.close();
      resolve(false);
    });
    server.on("error", () => {
      resolve(true);
    });
  });
}

// Schedule automated log cleanup
function scheduleLogCleanup(): void {
  // Run log cleanup daily at 2 AM
  const now = new Date();
  const nextCleanup = new Date(now);
  nextCleanup.setHours(2, 0, 0, 0); // 2 AM tomorrow

  if (nextCleanup <= now) {
    nextCleanup.setDate(nextCleanup.getDate() + 1);
  }

  const timeUntilCleanup = nextCleanup.getTime() - now.getTime();

  setTimeout(() => {
    // Run cleanup
    logger.cleanupOldLogs(30); // Keep 30 days of logs

    // Schedule next cleanup (daily)
    setInterval(
      () => {
        logger.cleanupOldLogs(30);
      },
      24 * 60 * 60 * 1000,
    ); // Every 24 hours
  }, timeUntilCleanup);
}

// Database connection
let db: initSqlJs.Database;
let SQL: initSqlJs.SqlJsStatic;
let dataSource: DataSource;
let ptoEntryDAL: PtoEntryDAL;

async function initDatabase() {
  try {
    logger.info("Initializing SQL.js...");
    SQL = await initSqlJs();
    logger.info("SQL.js initialized successfully.");

    logger.info("Creating database instance...");
    let filebuffer: Uint8Array | undefined;
    if (fs.existsSync(DB_PATH)) {
      filebuffer = fs.readFileSync(DB_PATH);
      logger.info("Loaded existing database file.");
    } else {
      logger.info("No existing database file found, creating new database.");
    }
    db = new SQL.Database(filebuffer);
    logger.info("Database instance created.");

    // Read and execute schema
    logger.info("Reading database schema...");
    const schemaPath = path.join(process.cwd(), "db", "schema.sql");
    logger.info(`Schema path: ${schemaPath} `);
    const schema = fs.readFileSync(schemaPath, "utf8");
    logger.info("Schema file read successfully.");

    logger.info("Executing schema...");
    db.exec(schema);
    logger.info("Schema executed successfully.");

    // Initialize TypeORM DataSource
    logger.info("Initializing TypeORM DataSource...");
    dataSource = new DataSource({
      type: "sqljs",
      location: DB_PATH,
      autoSave: true,
      entities: [
        Employee,
        PtoEntry,
        MonthlyHours,
        Acknowledgement,
        AdminAcknowledgement,
      ],
      synchronize: false, // Schema is managed manually
      logging: false,
    });

    logger.info("Connecting to database with TypeORM...");
    await dataSource.initialize();
    logger.info("Connected to SQLite database with TypeORM.");

    // Initialize DAL
    ptoEntryDAL = new PtoEntryDAL(dataSource);
    logger.info("PTO Entry DAL initialized.");
  } catch (error) {
    const err = error as Error;
    logger.error(`Database connection error: ${err} `);
    logger.error(`Error stack: ${err.stack} `);
    throw err;
  }
}

// Initialize database on startup
logger.info(`Start time: ${START_TIME} `);
logger.info(`Version: ${VERSION} `);
logger.info(`File age: ${FILE_AGE}`);
logger.info(`Port ${PORT}...`);

initDatabase()
  .then(async () => {
    // Health check endpoint
    app.get("/api/health", (req, res) => {
      logger.info(
        `API access: ${req.method} ${req.path} by unauthenticated user`,
      );
      res.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: "1.0.0",
      });
    });

    // Version endpoint
    app.get("/api/version", (req, res) => {
      logger.info(
        `API access: ${req.method} ${req.path} by unauthenticated user`,
      );
      res.json({
        version: VERSION,
        fileAge: FILE_AGE,
        startTime: START_TIME,
      });
    });

    // Backup status endpoint
    app.get("/api/backup/status", (req, res) => {
      logger.info(
        `API access: ${req.method} ${req.path} by unauthenticated user`,
      );
      try {
        res.json(getBackupStatus());
      } catch (error) {
        logger.error(`Failed to get backup status: ${error}`);
        res.status(500).json({ error: "Failed to get backup status" });
      }
    });

    // Backup restore endpoint
    app.post(
      "/api/backup/restore",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const backupPath = validateBackupFilename(req.body.filename);

          // Close current database connection
          if (dataSource && dataSource.isInitialized) {
            await dataSource.destroy();
            logger.info("DataSource destroyed for restore");
          }

          const preRestoreBackup = restoreFromBackup(backupPath);

          // Re-initialize database
          await initDatabase();
          logger.info("Database re-initialized after restore");

          res.json({
            message: "Database restored successfully",
            restoredFrom: req.body.filename,
            preRestoreBackup,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);

          if (message === "Filename is required") {
            return res.status(400).json({ error: message });
          }
          if (message === "Backup file not found") {
            return res.status(404).json({ error: message });
          }
          if (message === "Invalid backup filename format") {
            return res.status(400).json({ error: message });
          }

          logger.error(`Failed to restore backup: ${error}`);
          res.status(500).json({ error: "Failed to restore backup" });
        }
      },
    );

    // Test-only database reload endpoint
    app.post(
      "/api/test/reload-database",
      async (req: Request, res: Response) => {
        logger.info(
          `API access: ${req.method} ${req.path} by unauthenticated user`,
        );
        try {
          // Only allow in test environment or with special header
          if (
            process.env.NODE_ENV === "test" ||
            req.headers["x-test-reload"] === "true"
          ) {
            logger.info("Reloading database for testing...");

            // Destroy current DataSource
            if (dataSource && dataSource.isInitialized) {
              await dataSource.destroy();
              logger.info("DataSource destroyed.");
            }

            // Re-initialize database from disk
            await initDatabase();
            logger.info("Database reloaded from disk.");

            res.json({ message: "Database reloaded successfully" });
          } else {
            res.status(403).json({
              error:
                "Forbidden: Database reload only allowed in test environment",
            });
          }
        } catch (error) {
          logger.error(`Database reload error: ${error} `);
          res.status(500).json({ error: "Database reload failed" });
        }
      },
    );

    // Test-only database seed endpoint
    app.post("/api/test/seed", async (req: Request, res: Response) => {
      logger.info(
        `API access: ${req.method} ${req.path} by unauthenticated user`,
      );
      try {
        // Only allow in test/development environment or with special header
        if (
          process.env.NODE_ENV === "test" ||
          process.env.NODE_ENV === "development" ||
          req.headers["x-test-seed"] === "true"
        ) {
          logger.info("Seeding database for testing...");

          // Clear all tables
          db.exec("DELETE FROM admin_acknowledgements;");
          db.exec("DELETE FROM acknowledgements;");
          db.exec("DELETE FROM monthly_hours;");
          db.exec("DELETE FROM pto_entries;");
          db.exec("DELETE FROM employees;");

          // Reset auto-increment counters
          db.exec(
            'DELETE FROM sqlite_sequence WHERE name IN ("employees", "pto_entries", "monthly_hours", "acknowledgements", "admin_acknowledgements");',
          );

          // Insert seed employees
          for (const emp of seedEmployees) {
            db.exec(
              `INSERT INTO employees (name, identifier, pto_rate, carryover_hours, hire_date, role, hash) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                emp.name,
                emp.identifier,
                emp.pto_rate,
                emp.carryover_hours,
                emp.hire_date,
                emp.role,
                emp.hash,
              ],
            );
          }

          // Insert seed PTO entries
          for (const entry of seedPTOEntries) {
            db.exec(
              `INSERT INTO pto_entries (employee_id, date, type, hours, approved_by, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
              [
                entry.employee_id,
                entry.date,
                entry.type,
                entry.hours,
                entry.approved_by ?? null,
                new Date().toISOString(),
              ],
            );
          }

          logger.info("Database seeded successfully.");
          res.json({ message: "Database seeded successfully" });
        } else {
          res.status(403).json({
            error:
              "Forbidden: Database seeding only allowed in test environment",
          });
        }
      } catch (error) {
        logger.error(`Database seed error: ${error} `);
        res.status(500).json({ error: "Database seeding failed" });
      }
    });

    // Auth routes
    app.post(
      "/api/auth/request-link",
      [
        body("identifier")
          .isEmail()
          .withMessage("Valid email address required"),
      ],
      async (req: Request, res: Response) => {
        logger.info(
          `API access: ${req.method} ${req.path} by unauthenticated user`,
        );
        try {
          const errors = validationResult(req);
          if (!errors.isEmpty()) {
            return res
              .status(400)
              .json({ error: "Invalid input", details: errors.array() });
          }

          const { identifier } = req.body;
          const isTestMode =
            req.headers["x-test-mode"] === "true" ||
            process.env.NODE_ENV === "test";
          const isDirectMagicLink = process.env.MAGIC_LINK_DIRECT === "true";
          const shouldReturnMagicLink =
            isTestMode ||
            isDirectMagicLink ||
            process.env.NODE_ENV !== "production" ||
            !process.env.SMTP_HOST; // Return magic link if SMTP not configured

          const employeeRepo = dataSource.getRepository(Employee);
          const employee = await employeeRepo.findOne({
            where: { identifier },
          });

          if (!employee) {
            logger.info(`Login attempt for unknown user: ${identifier}`);
            if (shouldReturnMagicLink) {
              const baseUrl = getBaseUrl(req);
              const magicLink = `${baseUrl}/?token=missing-user`;
              logger.debug(`Magic link for ${identifier}: ${magicLink}`);
              return res.json({
                message: "Magic link generated",
                magicLink,
              });
            }
            // For security, don't reveal if user exists
            return res.json({
              message: SUCCESS_MESSAGES["auth.link_sent"],
            });
          }

          logger.info(
            `Login request for user: ${identifier} (Employee ID: ${employee.id})`,
          );

          // Generate secret hash if not exists
          let secretHash = employee.hash;
          if (!secretHash) {
            secretHash = crypto
              .createHash("sha256")
              .update(identifier + process.env.HASH_SALT || "default_salt")
              .digest("hex");
            employee.hash = secretHash;
            await employeeRepo.save(employee);
          }

          // Generate JWT token with email and expiration
          const jwtSecret =
            process.env.JWT_SECRET ||
            process.env.HASH_SALT ||
            "default_jwt_secret";
          const magicToken = jwt.sign(
            {
              email: identifier,
              exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
            },
            jwtSecret,
          );

          const baseUrl = getBaseUrl(req);
          const magicLink = `${baseUrl}/?token=${magicToken}`;

          if (shouldReturnMagicLink) {
            logger.debug(`Magic link for ${identifier}: ${magicLink}`);
          }

          if (shouldReturnMagicLink) {
            // For testing or POC, return the magic link directly
            return res.json({
              message: "Magic link generated",
              magicLink: magicLink,
            });
          }

          try {
            await sendMagicLinkEmail(identifier, magicLink);
            logger.info(`Magic link email sent to: ${identifier}`);
          } catch (emailError) {
            logger.error(`Error sending magic link email: ${emailError}`);
            return res
              .status(500)
              .json({ error: "Failed to send magic link email" });
          }

          res.json({
            message: SUCCESS_MESSAGES["auth.link_sent"],
          });
        } catch (error) {
          logger.error(`Error requesting magic link: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.get("/api/auth/validate", async (req, res) => {
      logger.info(
        `API access: ${req.method} ${req.path} by unauthenticated user`,
      );
      try {
        const { token } = req.query;
        if (!token) {
          logger.warn("Auth validation failed: Token required");
          return res.status(400).json({ error: "Token required" });
        }

        const jwtSecret =
          process.env.JWT_SECRET ||
          process.env.HASH_SALT ||
          "default_jwt_secret";
        let payload;
        try {
          payload = jwt.verify(token as string, jwtSecret) as jwt.JwtPayload;
        } catch (err) {
          logger.warn("Auth validation failed: Invalid or expired token");
          return res.status(401).json({ error: "Invalid or expired token" });
        }

        const { email } = payload;
        if (!email) {
          logger.warn("Auth validation failed: Token missing email");
          return res.status(401).json({ error: "Invalid token" });
        }

        // Find employee by identifier
        const employeeRepo = dataSource.getRepository(Employee);
        const employee = await employeeRepo.findOne({
          where: { identifier: email },
        });
        if (!employee) {
          logger.warn("Auth validation failed: Employee not found");
          return res.status(401).json({ error: "Invalid token" });
        }

        // Create session JWT token
        const sessionToken = jwt.sign(
          {
            employeeId: employee.id,
            role: employee.role,
            exp: Math.floor(Date.now() / 1000) + 10 * 365 * 24 * 60 * 60, // 10 years
          },
          jwtSecret,
        );

        // Return session token and employee info
        logger.info(
          `Auth validation successful for employee ${employee.id} (${employee.name})`,
        );
        res.json({
          authToken: sessionToken,
          expiresAt: Date.now() + 10 * 365 * 24 * 60 * 60 * 1000, // 10 years
          employee: {
            id: employee.id,
            name: employee.name,
            role: employee.role,
          },
        });
      } catch (error) {
        logger.error(`Error validating token: ${error}`);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    app.get(
      "/api/auth/validate-session",
      authenticate(() => dataSource, log),
      async (req, res) => {
        logger.info(
          `API access: ${req.method} ${req.path} by authenticated user ${req.employee!.id}`,
        );
        try {
          // If we reach here, authentication passed
          res.json({
            valid: true,
            employee: {
              id: req.employee!.id,
              name: req.employee!.name,
              role: req.employee!.role,
            },
          });
        } catch (error) {
          logger.error(`Error validating session: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // PTO routes
    app.get(
      "/api/pto/status",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          const authenticatedEmployeeId = req.employee!.id;

          const employeeRepo = dataSource.getRepository(Employee);
          const ptoEntryRepo = dataSource.getRepository(PtoEntry);

          const employee = await employeeRepo.findOne({
            where: { id: authenticatedEmployeeId },
          });
          if (!employee) {
            logger.info(
              `PTO status request failed: Employee not found: ${authenticatedEmployeeId}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          const ptoEntries = await ptoEntryRepo.find({
            where: { employee_id: authenticatedEmployeeId },
          });

          // Convert to PTO calculation format
          const hireDate =
            employee.hire_date instanceof Date
              ? employee.hire_date
              : new Date(employee.hire_date as any);

          const employeeData = {
            id: employee.id,
            name: employee.name,
            identifier: employee.identifier,
            pto_rate: employee.pto_rate,
            carryover_hours: employee.carryover_hours,
            hire_date: dateToString(hireDate),
            role: employee.role,
          };

          const ptoEntriesData = ptoEntries.map((entry) => ({
            id: entry.id,
            employee_id: entry.employee_id,
            date: entry.date,
            type: entry.type,
            hours: entry.hours,
            created_at: dateToString(
              entry.created_at instanceof Date
                ? entry.created_at
                : new Date(entry.created_at as any),
            ),
          }));

          const status = calculatePTOStatus(employeeData, ptoEntriesData);

          res.json(status);
        } catch (error) {
          logger.error(`Error getting PTO status: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Monthly Hours routes
    app.post(
      "/api/hours",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          if (!isHoursSubmitRequest(req.body)) {
            return res.status(400).json({ error: "Invalid request body" });
          }
          const { month, hours } = req.body;
          const employeeId = req.employee!.id; // Use authenticated user's ID

          if (!month || hours === undefined) {
            logger.warn(
              "Hours submission failed: Month and hours are required",
            );
            return res
              .status(400)
              .json({ error: "Month and hours are required" });
          }

          const hoursNum =
            typeof hours === "string" ? parseFloat(hours) : hours;

          if (isNaN(hoursNum)) {
            logger.info(`Hours submission failed: Invalid hours (${hours})`);
            return res.status(400).json({ error: "Invalid hours" });
          }

          // Validate hours (reasonable range: 0-400 hours per month)
          if (hoursNum < 0 || hoursNum > 400) {
            logger.info(
              `Hours submission failed: Hours must be between 0 and 400, got: ${hoursNum}`,
            );
            return res
              .status(400)
              .json({ error: "Hours must be between 0 and 400" });
          }

          const employeeRepo = dataSource.getRepository(Employee);
          const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);

          const employee = await employeeRepo.findOne({
            where: { id: employeeId },
          });
          if (!employee) {
            logger.info(
              `Hours submission failed: Employee not found: ${employeeId}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          // Parse month (expected format: YYYY-MM)
          const monthStart = month + "-01";
          if (!isValidDateString(monthStart)) {
            logger.info(
              `Hours submission failed: Invalid month format: ${month}`,
            );
            return res
              .status(400)
              .json({ error: "Invalid month format. Use YYYY-MM" });
          }

          // Check if hours already exist for this month
          const existingHours = await monthlyHoursRepo.findOne({
            where: { employee_id: employeeId, month: month },
          });

          if (existingHours) {
            // Update existing hours
            existingHours.hours_worked = hoursNum;
            existingHours.submitted_at = new Date(today());
            await monthlyHoursRepo.save(existingHours);
            const response: HoursSubmitResponse = {
              message: "Hours updated successfully",
              hours: serializeMonthlyHours(existingHours),
            };
            res.json(response);
          } else {
            // Create new hours entry
            const newHours = monthlyHoursRepo.create({
              employee_id: employeeId,
              month: month,
              hours_worked: hoursNum,
            });
            await monthlyHoursRepo.save(newHours);
            const response: HoursSubmitResponse = {
              message: "Hours submitted successfully",
              hours: serializeMonthlyHours(newHours),
            };
            res.status(201).json(response);
          }
        } catch (error) {
          logger.error(`Error submitting hours: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.get(
      "/api/hours",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          const { year } = req.query;
          const requestedEmployeeId = req.employee!.id;

          const employeeRepo = dataSource.getRepository(Employee);
          const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);

          const employee = await employeeRepo.findOne({
            where: { id: requestedEmployeeId },
          });
          if (!employee) {
            logger.info(
              `Hours retrieval failed: Employee not found: ${requestedEmployeeId}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          let whereCondition: any = { employee_id: requestedEmployeeId };
          if (year) {
            const yearNum = parseInt(year as string);
            if (!isNaN(yearNum)) {
              whereCondition.month = Between(
                `${yearNum}-01-01`,
                `${yearNum}-12-31`,
              );
            }
          }

          const hours = await monthlyHoursRepo.find({
            where: whereCondition,
            order: { month: "DESC" },
          });

          res.json({ employeeId: requestedEmployeeId, hours });
        } catch (error) {
          logger.error(`Error getting hours: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Acknowledgement routes
    app.post(
      "/api/acknowledgements",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          if (!isAcknowledgementSubmitRequest(req.body)) {
            return res.status(400).json({ error: "Invalid request body" });
          }
          const { month } = req.body;
          const employeeId = req.employee!.id; // Use authenticated user's ID

          if (!month) {
            logger.warn("Acknowledgement submission failed: Month is required");
            return res.status(400).json({ error: "Month is required" });
          }

          const employeeRepo = dataSource.getRepository(Employee);
          const acknowledgementRepo = dataSource.getRepository(Acknowledgement);

          const employee = await employeeRepo.findOne({
            where: { id: employeeId },
          });
          if (!employee) {
            logger.info(
              `Acknowledgement submission failed: Employee not found: ${employeeId}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          // Parse month (expected format: YYYY-MM)
          const monthStart = month + "-01";
          if (!isValidDateString(monthStart)) {
            logger.info(
              `Acknowledgement submission failed: Invalid month format: ${month}`,
            );
            return res
              .status(400)
              .json({ error: "Invalid month format. Use YYYY-MM" });
          }

          // Check if acknowledgement already exists for this month
          const existingAck = await acknowledgementRepo.findOne({
            where: { employee_id: employeeId, month: month },
          });

          if (existingAck) {
            logger.info(
              `Acknowledgement submission failed: Acknowledgement already exists for employee ${employeeId}, month ${month}`,
            );
            return res
              .status(409)
              .json({ error: "Acknowledgement already exists for this month" });
          }

          // Create new acknowledgement
          const newAck = acknowledgementRepo.create({
            employee_id: employeeId,
            month: month,
          });
          await acknowledgementRepo.save(newAck);

          const response: AcknowledgementSubmitResponse = {
            message: "Acknowledgement submitted successfully",
            acknowledgement: serializeAcknowledgement(newAck),
          };

          res.status(201).json(response);
        } catch (error) {
          logger.error(`Error submitting acknowledgement: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.get(
      "/api/acknowledgements",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          const requestedEmployeeId = req.employee!.id;

          const employeeRepo = dataSource.getRepository(Employee);
          const acknowledgementRepo = dataSource.getRepository(Acknowledgement);

          const employee = await employeeRepo.findOne({
            where: { id: requestedEmployeeId },
          });
          if (!employee) {
            logger.info(
              `Acknowledgement retrieval failed: Employee not found: ${requestedEmployeeId}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          const acknowledgements = await acknowledgementRepo.find({
            where: { employee_id: requestedEmployeeId },
            order: { month: "DESC" },
          });

          res.json({ employeeId: requestedEmployeeId, acknowledgements });
        } catch (error) {
          logger.error(`Error getting acknowledgements: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Monthly summary for acknowledgements
    app.get(
      "/api/monthly-summary/:month",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          const { month } = req.params;
          const monthStr = Array.isArray(month) ? month[0] : month;
          const requestedEmployeeId = req.employee!.id;

          const employeeRepo = dataSource.getRepository(Employee);
          const ptoEntryRepo = dataSource.getRepository(PtoEntry);
          const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);

          const employee = await employeeRepo.findOne({
            where: { id: requestedEmployeeId },
          });
          if (!employee) {
            logger.info(
              `Monthly summary request failed: Employee not found: ${requestedEmployeeId}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          // Parse month (expected format: YYYY-MM)
          const monthStart = monthStr + "-01";
          if (!isValidDateString(monthStart)) {
            logger.info(
              `Monthly summary request failed: Invalid month format: ${monthStr}`,
            );
            return res
              .status(400)
              .json({ error: "Invalid month format. Use YYYY-MM" });
          }

          // Get monthly hours for the month
          const monthlyHours = await monthlyHoursRepo.findOne({
            where: { employee_id: requestedEmployeeId, month: monthStr },
          });

          // Get PTO entries for the month
          const startOfMonthStr = monthStart;
          const endOfMonthStr = endOfMonth(monthStart);

          const ptoEntries = await ptoEntryRepo
            .createQueryBuilder("entry")
            .where("entry.employee_id = :employeeId", {
              employeeId: requestedEmployeeId,
            })
            .andWhere("entry.date >= :startDate", {
              startDate: startOfMonthStr,
            })
            .andWhere("entry.date <= :endDate", { endDate: endOfMonthStr })
            .getMany();

          // Calculate PTO usage by category
          const ptoByCategory = {
            PTO: 0,
            Sick: 0,
            Bereavement: 0,
            "Jury Duty": 0,
          };

          ptoEntries.forEach((entry) => {
            if (ptoByCategory.hasOwnProperty(entry.type)) {
              ptoByCategory[entry.type as keyof typeof ptoByCategory] +=
                entry.hours;
            }
          });

          res.json({
            employeeId: requestedEmployeeId,
            month,
            hoursWorked: monthlyHours ? monthlyHours.hours_worked : 0,
            ptoUsage: ptoByCategory,
          });
        } catch (error) {
          logger.error(`Error getting monthly summary: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Admin Acknowledgement routes
    app.post(
      "/api/admin-acknowledgements",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          if (!isAdminAcknowledgementSubmitRequest(req.body)) {
            return res.status(400).json({ error: "Invalid request body" });
          }
          const { employeeId, month } = req.body;
          const adminId = req.employee!.id; // Use authenticated admin's ID

          if (!employeeId || !month) {
            logger.info(
              "Admin acknowledgement submission failed: Employee ID and month are required",
            );
            return res
              .status(400)
              .json({ error: "Employee ID and month are required" });
          }

          const employeeIdNum = parseInt(String(employeeId));

          if (isNaN(employeeIdNum)) {
            logger.info(
              `Admin acknowledgement submission failed: Invalid employee ID: ${employeeId}`,
            );
            return res.status(400).json({ error: "Invalid employee ID" });
          }

          const employeeRepo = dataSource.getRepository(Employee);
          const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);

          const employee = await employeeRepo.findOne({
            where: { id: employeeIdNum },
          });
          if (!employee) {
            logger.info(
              `Admin acknowledgement submission failed: Employee not found: ${employeeIdNum}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          // Parse month (expected format: YYYY-MM)
          const monthStr = month;
          if (!/^\d{4}-\d{2}$/.test(monthStr)) {
            logger.info(
              `Admin acknowledgement submission failed: Invalid month format: ${monthStr}`,
            );
            return res
              .status(400)
              .json({ error: "Invalid month format. Use YYYY-MM" });
          }

          // Check if admin acknowledgement already exists for this month
          const existingAck = await adminAckRepo.findOne({
            where: { employee_id: employeeIdNum, month: monthStr },
          });

          if (existingAck) {
            logger.info(
              `Admin acknowledgement submission failed: Admin acknowledgement already exists for employee ${employeeIdNum}, month ${monthStr}`,
            );
            return res.status(409).json({
              error: "Admin acknowledgement already exists for this month",
            });
          }

          // Create new admin acknowledgement
          const newAck = adminAckRepo.create({
            employee_id: employeeIdNum,
            month: monthStr,
            admin_id: adminId,
          });
          await adminAckRepo.save(newAck);

          const response: AdminAcknowledgementSubmitResponse = {
            message: "Admin acknowledgement submitted successfully",
            acknowledgement: serializeAdminAcknowledgement(newAck),
          };

          res.status(201).json(response);
        } catch (error) {
          logger.error(`Error submitting admin acknowledgement: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.get(
      "/api/admin-acknowledgements/:employeeId",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const { employeeId } = req.params;
          const employeeIdNum = parseInt(employeeId as string);
          const adminId = req.employee!.id;

          if (isNaN(employeeIdNum)) {
            logger.info(
              `Admin acknowledgement retrieval failed: Invalid employee ID (${employeeId})`,
            );
            return res.status(400).json({ error: "Invalid employee ID" });
          }

          const employeeRepo = dataSource.getRepository(Employee);
          const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);

          const employee = await employeeRepo.findOne({
            where: { id: employeeIdNum },
          });
          if (!employee) {
            logger.info(
              `Admin acknowledgement retrieval failed: Employee not found: ${employeeIdNum}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          const acknowledgements = await adminAckRepo.find({
            where: { employee_id: employeeIdNum },
            order: { month: "DESC" },
            relations: ["admin"],
          });

          res.json({ employeeId: employeeIdNum, acknowledgements });
        } catch (error) {
          logger.error(`Error getting admin acknowledgements: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Admin Monthly Review endpoint
    app.get(
      "/api/admin/monthly-review/:month",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const { month } = req.params;
          const monthStr = Array.isArray(month) ? month[0] : month;

          // Validate month format
          if (!/^\d{4}-\d{2}$/.test(monthStr)) {
            logger.info(
              `Admin monthly review failed: Invalid month format: ${monthStr}`,
            );
            return res
              .status(400)
              .json({ error: "Invalid month format. Use YYYY-MM" });
          }

          const employeeRepo = dataSource.getRepository(Employee);
          const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);
          const ptoEntryRepo = dataSource.getRepository(PtoEntry);
          const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);

          // Get all employees
          const employees = await employeeRepo.find({
            order: { name: "ASC" },
          });

          const result: AdminMonthlyReviewItem[] = [];

          for (const employee of employees) {
            // Get monthly hours for this employee and month
            const monthlyHours = await monthlyHoursRepo.findOne({
              where: { employee_id: employee.id, month: monthStr },
            });

            // Get PTO entries for this employee and month
            const monthStart = monthStr + "-01";
            const monthEnd = endOfMonth(monthStart);

            const ptoEntries = await ptoEntryRepo.find({
              where: {
                employee_id: employee.id,
                date: Between(monthStart, monthEnd),
              },
            });

            // Calculate PTO usage by category
            const ptoByCategory = {
              PTO: 0,
              Sick: 0,
              Bereavement: 0,
              "Jury Duty": 0,
            };

            ptoEntries.forEach((entry) => {
              if (ptoByCategory.hasOwnProperty(entry.type)) {
                ptoByCategory[entry.type as keyof typeof ptoByCategory] +=
                  entry.hours;
              }
            });

            // Check if acknowledged by admin
            const adminAck = await adminAckRepo.findOne({
              where: { employee_id: employee.id, month: monthStr },
              relations: ["admin"],
            });

            result.push({
              employeeId: employee.id,
              employeeName: employee.name,
              month: monthStr,
              totalHours: monthlyHours ? monthlyHours.hours_worked : 0,
              ptoHours: ptoByCategory.PTO,
              sickHours: ptoByCategory.Sick,
              bereavementHours: ptoByCategory.Bereavement,
              juryDutyHours: ptoByCategory["Jury Duty"],
              acknowledgedByAdmin: !!adminAck,
              adminAcknowledgedAt: adminAck
                ? dateToString(adminAck.acknowledged_at)
                : undefined,
              adminAcknowledgedBy: adminAck?.admin?.name || undefined,
            });
          }

          res.json(result);
        } catch (error) {
          logger.error(`Error getting admin monthly review: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Admin Monthly Review endpoint
    app.get(
      "/api/admin/monthly-review/:month",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const { month } = req.params;
          const monthStr = Array.isArray(month) ? month[0] : month;

          // Validate month format
          if (!/^\d{4}-\d{2}$/.test(monthStr)) {
            log(
              `Admin monthly review failed: Invalid month format: ${monthStr}`,
            );
            return res
              .status(400)
              .json({ error: "Invalid month format. Use YYYY-MM" });
          }

          const employeeRepo = dataSource.getRepository(Employee);
          const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);
          const ptoEntryRepo = dataSource.getRepository(PtoEntry);
          const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);

          // Get all employees
          const employees = await employeeRepo.find({
            order: { name: "ASC" },
          });

          const result: AdminMonthlyReviewItem[] = [];

          for (const employee of employees) {
            // Get monthly hours for this employee and month
            const monthlyHours = await monthlyHoursRepo.findOne({
              where: { employee_id: employee.id, month: monthStr },
            });

            // Get PTO entries for this employee and month
            const monthStart = monthStr + "-01";
            const monthEnd = endOfMonth(monthStart);

            const ptoEntries = await ptoEntryRepo.find({
              where: {
                employee_id: employee.id,
                date: Between(monthStart, monthEnd),
              },
            });

            // Calculate PTO usage by category
            const ptoByCategory = {
              PTO: 0,
              Sick: 0,
              Bereavement: 0,
              "Jury Duty": 0,
            };

            ptoEntries.forEach((entry) => {
              if (ptoByCategory.hasOwnProperty(entry.type)) {
                ptoByCategory[entry.type as keyof typeof ptoByCategory] +=
                  entry.hours;
              }
            });

            // Check if acknowledged by admin
            const adminAck = await adminAckRepo.findOne({
              where: { employee_id: employee.id, month: monthStr },
              relations: ["admin"],
            });

            result.push({
              employeeId: employee.id,
              employeeName: employee.name,
              month: monthStr,
              totalHours: monthlyHours ? monthlyHours.hours_worked : 0,
              ptoHours: ptoByCategory.PTO,
              sickHours: ptoByCategory.Sick,
              bereavementHours: ptoByCategory.Bereavement,
              juryDutyHours: ptoByCategory["Jury Duty"],
              acknowledgedByAdmin: !!adminAck,
              adminAcknowledgedAt: adminAck
                ? dateToString(adminAck.acknowledged_at)
                : undefined,
              adminAcknowledgedBy: adminAck?.admin?.name || undefined,
            });
          }

          res.json(result);
        } catch (error) {
          log(`Error getting admin monthly review: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Enhanced Employee routes
    app.get(
      "/api/employees",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const { search, role } = req.query;
          const employeeRepo = dataSource.getRepository(Employee);

          let whereCondition: any = {};

          if (search) {
            whereCondition.name = Like(`%${search}%`);
          }

          if (role) {
            whereCondition.role = role;
          }

          const employees = await employeeRepo.find({
            where: whereCondition,
            order: { name: "ASC" },
          });

          res.json(employees.map((e) => serializeEmployee(e)));
        } catch (error) {
          logger.error(`Error getting employees: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.get(
      "/api/employees/:id",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const { id } = req.params;
          const employeeIdNum = parseInt(id as string);

          if (isNaN(employeeIdNum)) {
            logger.info(
              `Employee retrieval failed: Invalid employee ID: ${id}`,
            );
            return res.status(400).json({ error: "Invalid employee ID" });
          }

          const employeeRepo = dataSource.getRepository(Employee);
          const employee = await employeeRepo.findOne({
            where: { id: employeeIdNum },
          });

          if (!employee) {
            logger.info(
              `Employee retrieval failed: Employee not found: ${employeeIdNum}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          res.json(employee);
        } catch (error) {
          logger.error(`Error getting employee: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.post(
      "/api/employees",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          if (!isEmployeeCreateRequest(req.body)) {
            return res.status(400).json({ error: "Invalid request body" });
          }
          const { name, identifier, ptoRate, carryoverHours, hireDate, role } =
            req.body;

          // Validation
          if (!name || typeof name !== "string" || name.trim().length === 0) {
            return res.status(400).json({
              error: "Name is required and must be a non-empty string",
            });
          }
          if (
            !identifier ||
            typeof identifier !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
          ) {
            return res
              .status(400)
              .json({ error: "Identifier must be a valid email address" });
          }

          const employeeRepo = dataSource.getRepository(Employee);

          // Check if identifier already exists
          const existingEmployee = await employeeRepo.findOne({
            where: { identifier },
          });
          if (existingEmployee) {
            return res
              .status(409)
              .json({ error: "Employee with this email already exists" });
          }

          const employee = new Employee();
          employee.name = name.trim();
          employee.identifier = identifier;
          employee.pto_rate =
            ptoRate !== undefined
              ? typeof ptoRate === "string"
                ? parseFloat(ptoRate)
                : ptoRate
              : BUSINESS_RULES_CONSTANTS.BASELINE_PTO_HOURS_PER_YEAR /
                getTotalWorkDaysInYear(new Date().getFullYear());
          employee.carryover_hours =
            carryoverHours !== undefined
              ? typeof carryoverHours === "string"
                ? parseFloat(carryoverHours)
                : carryoverHours
              : 0;
          employee.hire_date = hireDate
            ? new Date(hireDate)
            : new Date(today());
          employee.role = role || "Employee";

          await employeeRepo.save(employee);

          const response: EmployeeCreateResponse = {
            message: "Employee created successfully",
            employee: serializeEmployee(employee),
          };

          res.status(201).json(response);
        } catch (error) {
          logger.error(`Error creating employee: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.put(
      "/api/employees/:id",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const { id } = req.params;
          const employeeIdNum = parseInt(id as string);

          if (isNaN(employeeIdNum)) {
            logger.info(`Employee update failed: Invalid employee ID: ${id}`);
            return res.status(400).json({ error: "Invalid employee ID" });
          }

          if (!isEmployeeUpdateRequest(req.body)) {
            return res.status(400).json({ error: "Invalid request body" });
          }
          const { name, identifier, ptoRate, carryoverHours, hireDate, role } =
            req.body;

          const employeeRepo = dataSource.getRepository(Employee);
          const employee = await employeeRepo.findOne({
            where: { id: employeeIdNum },
          });

          if (!employee) {
            logger.info(
              `Employee update failed: Employee not found: ${employeeIdNum}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          // Validation
          if (
            name !== undefined &&
            (typeof name !== "string" || name.trim().length === 0)
          ) {
            return res
              .status(400)
              .json({ error: "Name must be a non-empty string" });
          }
          if (
            identifier !== undefined &&
            (typeof identifier !== "string" ||
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier))
          ) {
            return res
              .status(400)
              .json({ error: "Identifier must be a valid email address" });
          }

          // Check if identifier already exists (excluding current employee)
          if (identifier !== undefined) {
            const existingEmployee = await employeeRepo.findOne({
              where: { identifier },
            });
            if (existingEmployee && existingEmployee.id !== employeeIdNum) {
              return res
                .status(409)
                .json({ error: "Employee with this email already exists" });
            }
          }

          // Update fields if provided
          if (name !== undefined) employee.name = name;
          if (identifier !== undefined) employee.identifier = identifier;
          if (ptoRate !== undefined)
            employee.pto_rate =
              typeof ptoRate === "string" ? parseFloat(ptoRate) : ptoRate;
          if (carryoverHours !== undefined)
            employee.carryover_hours =
              typeof carryoverHours === "string"
                ? parseFloat(carryoverHours)
                : carryoverHours;
          if (hireDate !== undefined) employee.hire_date = new Date(hireDate);
          if (role !== undefined) employee.role = role;

          await employeeRepo.save(employee);

          res.json({
            message: "Employee updated successfully",
            employee: serializeEmployee(employee),
          } as EmployeeUpdateResponse);
        } catch (error) {
          logger.error(`Error updating employee: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.delete(
      "/api/employees/:id",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const { id } = req.params;
          const employeeIdNum = parseInt(id as string);

          if (isNaN(employeeIdNum)) {
            logger.info(`Employee deletion failed: Invalid employee ID: ${id}`);
            return res.status(400).json({ error: "Invalid employee ID" });
          }

          const employeeRepo = dataSource.getRepository(Employee);
          const employee = await employeeRepo.findOne({
            where: { id: employeeIdNum },
          });

          if (!employee) {
            logger.info(
              `Employee deletion failed: Employee not found: ${employeeIdNum}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          await employeeRepo.remove(employee);

          res.json({ message: "Employee deleted successfully" });
        } catch (error) {
          logger.error(`Error deleting employee: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Admin endpoints for employee data
    app.get(
      "/api/employees/:id/monthly-hours",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const { id } = req.params;
          const employeeIdNum = parseInt(id as string);

          if (isNaN(employeeIdNum)) {
            logger.info(
              `Employee monthly hours retrieval failed: Invalid employee ID: ${id}`,
            );
            return res.status(400).json({ error: "Invalid employee ID" });
          }

          const employeeRepo = dataSource.getRepository(Employee);
          const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);

          const employee = await employeeRepo.findOne({
            where: { id: employeeIdNum },
          });
          if (!employee) {
            logger.info(
              `Employee monthly hours retrieval failed: Employee not found: ${employeeIdNum}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          const hours = await monthlyHoursRepo.find({
            where: { employee_id: employeeIdNum },
            order: { month: "DESC" },
          });

          res.json(hours);
        } catch (error) {
          logger.error(`Error getting employee monthly hours: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.get(
      "/api/employees/:id/pto-entries",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const { id } = req.params;
          const employeeIdNum = parseInt(id as string);

          if (isNaN(employeeIdNum)) {
            logger.info(
              `Employee PTO entries retrieval failed: Invalid employee ID: ${id}`,
            );
            return res.status(400).json({ error: "Invalid employee ID" });
          }

          const employeeRepo = dataSource.getRepository(Employee);
          const ptoEntryRepo = dataSource.getRepository(PtoEntry);

          const employee = await employeeRepo.findOne({
            where: { id: employeeIdNum },
          });
          if (!employee) {
            logger.info(
              `Employee PTO entries retrieval failed: Employee not found: ${employeeIdNum}`,
            );
            return res.status(404).json({ error: "Employee not found" });
          }

          const ptoEntries = await ptoEntryRepo.find({
            where: { employee_id: employeeIdNum },
            order: { date: "DESC" },
          });

          res.json(ptoEntries);
        } catch (error) {
          logger.error(`Error getting employee PTO entries: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Admin PTO endpoint — returns all employees' PTO entries (admin only)
    app.get(
      "/api/admin/pto",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const { type, startDate, endDate } = req.query;
          const ptoEntryRepo = dataSource.getRepository(PtoEntry);

          let whereCondition: any = {};

          if (type) {
            whereCondition.type = type;
          }

          if (startDate || endDate) {
            whereCondition.date = {};
            if (startDate) whereCondition.date.$gte = startDate as string;
            if (endDate) whereCondition.date.$lte = endDate as string;
          }

          const ptoEntries = await ptoEntryRepo.find({
            where: whereCondition,
            order: { date: "DESC" },
          });

          const serializedEntries = ptoEntries.map((entry) =>
            serializePTOEntry(entry),
          );

          res.json(serializedEntries);
        } catch (error) {
          logger.error(`Error getting admin PTO entries: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // PTO Management routes
    app.get(
      "/api/pto",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          const { type, startDate, endDate } = req.query;
          const authenticatedEmployeeId = req.employee!.id;
          const ptoEntryRepo = dataSource.getRepository(PtoEntry);

          let whereCondition: any = {};

          // Always scope to the authenticated user's own PTO entries.
          // Admin access to all employees' entries uses GET /api/admin/pto.
          whereCondition.employee_id = authenticatedEmployeeId;

          if (type) {
            whereCondition.type = type;
          }

          if (startDate || endDate) {
            whereCondition.date = {};
            if (startDate) whereCondition.date.$gte = startDate as string;
            if (endDate) whereCondition.date.$lte = endDate as string;
          }

          const ptoEntries = await ptoEntryRepo.find({
            where: whereCondition,
            order: { date: "DESC" },
          });

          console.log(
            `PTO entries for employee ${authenticatedEmployeeId}:`,
            ptoEntries.map((e) => ({ date: e.date, type: e.type })),
          );

          const serializedEntries = ptoEntries.map((entry) =>
            serializePTOEntry(entry),
          );

          res.json(serializedEntries);
        } catch (error) {
          logger.error(`Error getting PTO entries: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.post(
      "/api/pto",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          if (
            !isPTOCreateRequest(req.body) &&
            !isPTOBulkCreateRequest(req.body)
          ) {
            return res.status(400).json({ error: "Invalid request body" });
          }
          const body = req.body as PTOCreateRequest | PTOBulkCreateRequest;
          const { date, hours, type, requests } = body as any; // Type assertion for destructuring
          const authenticatedEmployeeId = req.employee!.id;

          // Handle both single request and multiple requests
          const ptoRequests = requests || [
            { employeeId: authenticatedEmployeeId, date, hours, type },
          ];

          const ptoEntryRepo = dataSource.getRepository(PtoEntry);
          const results = [];
          for (const request of ptoRequests) {
            const {
              employeeId: empId,
              date: reqDate,
              hours: reqHours,
              type: reqType,
            } = request;

            // For non-admin users, force the employeeId to be their own.
            // For admins, use the provided empId if present, otherwise
            // default to their own ID (self-submission from the calendar).
            const targetEmployeeId =
              req.employee!.role === "Admin"
                ? (empId ?? authenticatedEmployeeId)
                : authenticatedEmployeeId;

            if (
              !targetEmployeeId ||
              !reqDate ||
              reqHours === undefined ||
              !reqType
            ) {
              return res.status(400).json({
                error:
                  "All fields are required for each request: employeeId, date, hours, type",
              });
            }

            const empIdNum = parseInt(targetEmployeeId);
            const reqHoursNum = parseFloat(reqHours);

            if (isNaN(empIdNum) || isNaN(reqHoursNum)) {
              return res
                .status(400)
                .json({ error: "Invalid employee ID or hours" });
            }

            // Handle 0-hour requests: unschedule an existing entry
            if (reqHoursNum === 0) {
              const existingEntry = await ptoEntryRepo.findOne({
                where: {
                  employee_id: empIdNum,
                  date: reqDate,
                  type: reqType,
                },
              });

              if (!existingEntry) {
                return res.status(400).json({
                  error: "validation_failed",
                  fieldErrors: [
                    {
                      field: "hours",
                      message:
                        "Cannot unschedule: no existing entry of this type on this date",
                    },
                  ],
                });
              }

              await ptoEntryRepo.remove(existingEntry);
              logger.info(
                `PTO entry unscheduled: Employee ${empIdNum}, Date ${reqDate}, Type ${reqType}`,
              );
              continue; // Skip to next request
            }

            const result = await ptoEntryDAL.createPtoEntry({
              employeeId: empIdNum,
              date: reqDate,
              hours: reqHoursNum,
              type: reqType,
            });

            if (!result.success) {
              // Check if this is a duplicate entry error
              const hasDuplicateError = result.errors.some(
                (err) => err.messageKey === "pto.duplicate",
              );

              if (hasDuplicateError) {
                // Check if there's an existing entry with the same date and employee
                const existingEntry = await ptoEntryRepo.findOne({
                  where: {
                    employee_id: empIdNum,
                    date: reqDate,
                  },
                });

                if (existingEntry) {
                  // If the existing entry has the same type, update it instead
                  if (existingEntry.type === reqType) {
                    const updateResult = await ptoEntryDAL.updatePtoEntry(
                      existingEntry.id,
                      {
                        hours: reqHoursNum,
                      },
                    );

                    if (!updateResult.success) {
                      const fieldErrors = updateResult.errors.map((err) => ({
                        field: err.field,
                        message:
                          VALIDATION_MESSAGES[err.messageKey as MessageKey],
                      }));
                      logger.warn(
                        `PTO update validation failed for employee ${empIdNum}: ${fieldErrors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
                      );
                      return res
                        .status(400)
                        .json({ error: "validation_failed", fieldErrors });
                    }

                    results.push(updateResult.ptoEntry);
                    continue; // Skip to next request
                  }
                  // If different type, return the duplicate error
                }
              }

              // For other validation errors, return them as before
              const fieldErrors = result.errors.map((err) => ({
                field: err.field,
                message: VALIDATION_MESSAGES[err.messageKey as MessageKey],
              }));
              logger.warn(
                `PTO creation validation failed for employee ${empIdNum}: ${fieldErrors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
              );
              return res
                .status(400)
                .json({ error: "validation_failed", fieldErrors });
            }

            results.push(result.ptoEntry);
          }

          logger.info(
            `PTO entries processed successfully: ${results.length} entries`,
          );
          results.forEach((entry, index) => {
            logger.info(
              `Entry ${index + 1}: Employee ${entry.employee_id}, Date ${entry.date}, Type ${entry.type}, Hours ${entry.hours}`,
            );
          });

          // If all requests were unschedules (0-hour), results may be empty
          if (results.length === 0) {
            return res.json({
              message: "PTO entries unscheduled successfully",
            });
          }

          const lastResult = results[results.length - 1];
          const response: PTOCreateResponse = {
            message: SUCCESS_MESSAGES["pto.created"],
            ptoEntry: serializePTOEntry(lastResult),
          };

          logger.info(
            `PTO entry created: Employee ${lastResult.employee_id}, Date ${lastResult.date}, Type ${lastResult.type}, Hours ${lastResult.hours}`,
          );

          res.status(201).json(response);
        } catch (error) {
          logger.error(`Error creating PTO entries: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.put(
      "/api/pto/:id",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          const { id } = req.params;
          const ptoIdNum = parseInt(id as string);
          const authenticatedEmployeeId = req.employee!.id;

          if (isNaN(ptoIdNum)) {
            return res.status(400).json({ error: "Invalid PTO entry ID" });
          }

          // Check if the PTO entry belongs to the authenticated user or if user is admin
          const ptoEntryRepo = dataSource.getRepository(PtoEntry);
          const ptoEntry = await ptoEntryRepo.findOne({
            where: { id: ptoIdNum },
          });

          if (!ptoEntry) {
            return res.status(404).json({ error: "PTO entry not found" });
          }

          if (
            ptoEntry.employee_id !== authenticatedEmployeeId &&
            req.employee!.role !== "Admin"
          ) {
            return res
              .status(403)
              .json({ error: "You can only modify your own PTO entries" });
          }

          if (!isPTOUpdateRequest(req.body)) {
            return res.status(400).json({ error: "Invalid request body" });
          }
          const { date, type, hours, approved_by } = req.body;

          const updateData: any = {};
          if (date !== undefined) updateData.date = date;
          if (type !== undefined) updateData.type = type;
          if (hours !== undefined)
            updateData.hours =
              typeof hours === "string" ? parseFloat(hours) : hours;
          if (approved_by !== undefined) {
            // Only admins can set approved_by
            if (req.employee!.role === "Admin") {
              updateData.approved_by = approved_by;
            }
          }

          const result = await ptoEntryDAL.updatePtoEntry(ptoIdNum, updateData);

          if (!result.success) {
            const fieldErrors = result.errors.map((err) => ({
              field: err.field,
              message: VALIDATION_MESSAGES[err.messageKey as MessageKey],
            }));
            logger.warn(
              `PTO update validation failed for entry ${ptoIdNum}: ${fieldErrors.map((e) => `${e.field}: ${e.message}`).join(", ")}`,
            );
            return res
              .status(400)
              .json({ error: "validation_failed", fieldErrors });
          }

          res.json({
            message: "PTO entry updated successfully",
            ptoEntry: serializePTOEntry(result.ptoEntry),
          } as PTOUpdateResponse);
        } catch (error) {
          logger.error(`Error updating PTO entry: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    app.delete(
      "/api/pto/:id",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          const { id } = req.params;
          const ptoIdNum = parseInt(id as string);
          const authenticatedEmployeeId = req.employee!.id;

          if (isNaN(ptoIdNum)) {
            return res.status(400).json({ error: "Invalid PTO entry ID" });
          }

          const ptoEntryRepo = dataSource.getRepository(PtoEntry);
          const ptoEntry = await ptoEntryRepo.findOne({
            where: { id: ptoIdNum },
          });

          if (!ptoEntry) {
            return res.status(404).json({ error: "PTO entry not found" });
          }

          if (
            ptoEntry.employee_id !== authenticatedEmployeeId &&
            req.employee!.role !== "Admin"
          ) {
            return res
              .status(403)
              .json({ error: "You can only delete your own PTO entries" });
          }

          await ptoEntryRepo.remove(ptoEntry);

          res.json({ message: "PTO entry deleted successfully" });
        } catch (error) {
          logger.error(`Error deleting PTO entry: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // PTO Year Review endpoint
    app.get(
      "/api/pto/year/:year",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          const { year } = req.params;
          const yearNum = parseInt(year as string);
          const authenticatedEmployeeId = req.employee!.id;

          // Validate year parameter
          const currentYear = parseInt(today().split("-")[0]);
          if (
            isNaN(yearNum) ||
            yearNum < currentYear - 10 ||
            yearNum > currentYear
          ) {
            return res.status(400).json({
              error:
                "Invalid year parameter. Year must be between " +
                (currentYear - 10) +
                " and " +
                currentYear,
            });
          }

          const ptoEntryRepo = dataSource.getRepository(PtoEntry);

          // Get PTO entries for the specified year
          const startDate = `${yearNum}-01-01`; // January 1st
          const endDate = `${yearNum}-12-31`; // December 31st

          const ptoEntries = await ptoEntryRepo.find({
            where: {
              employee_id: authenticatedEmployeeId,
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
            const { day: totalDays } = getDateComponents(monthEnd);
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
                approved_by: entry.approved_by ?? null,
              })),
              summary,
            });
          }

          res.json({
            year: yearNum,
            months,
          });
        } catch (error) {
          logger.error(`Error getting PTO year review: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Bulk data import endpoint for migration
    app.post(
      "/api/migrate/bulk",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const result = await performBulkMigration(
            dataSource,
            ptoEntryDAL,
            log,
            today,
            isValidDateString,
            req.body,
          );
          res.json(result);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === "Valid employee email is required"
          ) {
            return res.status(400).json({ error: error.message });
          }
          logger.error(`Error in bulk migration: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // File-based bulk data import endpoint for migration
    app.post(
      "/api/migrate/file",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          if (!isFileMigrationRequest(req.body)) {
            return res.status(400).json({ error: "Invalid request body" });
          }
          const { employeeEmail, filePath } = req.body;
          if (!filePath) {
            return res.status(400).json({ error: "File path is required" });
          }
          // Validate employee email before file operations
          if (
            !employeeEmail ||
            typeof employeeEmail !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employeeEmail)
          ) {
            return res
              .status(400)
              .json({ error: "Valid employee email is required" });
          }
          const result = await performFileMigration(
            dataSource,
            ptoEntryDAL,
            log,
            today,
            isValidDateString,
            { employeeEmail, filePath },
          );
          res.json(result);
        } catch (error) {
          logger.error(`Error in file migration: ${error}`);
          // Check if it's a validation error
          if (
            error instanceof Error &&
            error.message === "Valid employee email is required"
          ) {
            return res.status(400).json({ error: error.message });
          }
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // ── SPA catch-all: serve index.html for all non-API, non-static paths ──
    // This enables direct URL access to client-side routes like /submit-time-off,
    // /admin/employees, etc. without a 404.
    app.get("{*path}", (req, res) => {
      // Skip API paths — they should have been handled above
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      // Serve index.html for all other paths (SPA routing)
      res.sendFile(path.join(process.cwd(), "public", "index.html"));
    });

    // Start server
    logger.info(`Checking if port ${PORT} is available...`);
    const portInUse = await checkPortInUse(PORT);
    if (portInUse) {
      logger.info(
        `Port ${PORT} is already in use. Please stop the other server or use a different port.`,
      );
      process.exit(1);
    }

    logger.info(`Attempting to start server on port ${PORT}...`);
    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info(`Server successfully listening on port ${PORT}`);
      logger.info(`Server available at:`);
      logger.info(`  http://localhost:${PORT}`);
      logger.info(`  http://127.0.0.1:${PORT}`);
      logger.info(`  http://0.0.0.0:${PORT}`);

      // Initialise backup system (request-driven, no scheduler)
      initBackupSystem();

      // Schedule log cleanup
      scheduleLogCleanup();
      logger.info("Log cleanup system started");
    });

    server.on("error", (error) => {
      logger.info(`Server failed to start: ${error.message}`);
      process.exit(1);
    });

    // Handle process termination
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  })
  .catch((error) => {
    logger.info(`Database initialization failed: ${error.message}`);
    logger.info(`Stack trace: ${error.stack}`);
    process.exit(1);
  });
