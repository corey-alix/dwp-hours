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
import { DataSource, Not, IsNull, Between, Like, In } from "typeorm";
import {
  Employee,
  PtoEntry,
  MonthlyHours,
  Acknowledgement,
  AdminAcknowledgement,
  Notification,
} from "./entities/index.js";
import { calculatePTOStatus } from "./ptoCalculations.js";
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
  NOTIFICATION_MESSAGES,
  PTO_EARNING_SCHEDULE,
  CARRYOVER_LIMIT,
  MessageKey,
  validatePTOBalance,
  validateMonthEditable,
  formatLockedMessage,
  validateAdminCanLockMonth,
  formatMonthNotEndedMessage,
  getEarliestAdminLockDate,
  getEffectivePtoRate,
  computeAnnualAllocation,
  computeCarryover,
  computeTerminationPayout,
  computeAccrualWithHireDate,
  checkSickDayThreshold,
  isAllowedEmailDomain,
  SYS_ADMIN_EMPLOYEE_ID,
  ENABLE_IMPORT_AUTO_APPROVE,
  computeEmployeeBalanceData,
  type PTOType,
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
import { assembleReportData } from "./reportService.js";
import { generateHtmlReport } from "./reportGenerators/htmlReport.js";
import { generateExcelReport } from "./reportGenerators/excelReport.js";
import { importExcelWorkbook, upsertEmployee, upsertPtoEntries, upsertAcknowledgements } from "./reportGenerators/excelImport.js";
import { type AutoApproveImportContext } from "../shared/businessRules.js";
import multer from "multer";
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

function isNotificationCreateRequest(
  obj: any,
): obj is { employeeId: number; type: string; message: string } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof obj.employeeId === "number" &&
    typeof obj.type === "string" &&
    typeof obj.message === "string"
  );
}

/**
 * Checks whether a given employee/month combination is locked by an admin acknowledgement.
 * Returns lock metadata (admin name, acknowledged timestamp) or null if the month is open.
 */
async function checkMonthLocked(
  employeeId: number,
  month: string,
): Promise<{ lockedBy: string; lockedAt: string } | null> {
  const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);
  const ack = await adminAckRepo.findOne({
    where: { employee_id: employeeId, month },
    relations: ["admin"],
  });
  if (!ack) return null;
  const adminName = ack.admin?.name ?? `Admin #${ack.admin_id}`;
  const lockedAt =
    ack.acknowledged_at instanceof Date
      ? ack.acknowledged_at.toISOString()
      : String(ack.acknowledged_at);
  return { lockedBy: adminName, lockedAt };
}

/**
 * Helper that checks the month lock and, if locked, sends an HTTP 409 response.
 * Returns `true` if the response was sent (caller should return early).
 */
async function rejectIfMonthLocked(
  res: Response,
  employeeId: number,
  month: string,
): Promise<boolean> {
  const lockInfo = await checkMonthLocked(employeeId, month);
  if (!lockInfo) return false;

  const error = validateMonthEditable(true, {
    adminName: lockInfo.lockedBy,
    acknowledgedAt: lockInfo.lockedAt,
  });

  logger.warn(
    `Month lock rejected: employee ${employeeId}, month ${month} — locked by ${lockInfo.lockedBy} at ${lockInfo.lockedAt}`,
  );

  res.status(409).json({
    error: "month_locked",
    message: formatLockedMessage(lockInfo.lockedBy, lockInfo.lockedAt),
    lockedBy: lockInfo.lockedBy,
    lockedAt: lockInfo.lockedAt,
    field: error!.field,
    messageKey: error!.messageKey,
  });
  return true;
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

    // Run safe migrations for existing databases
    // SQLite throws "duplicate column name" if column already exists — that's OK.
    const migrations = [
      "ALTER TABLE acknowledgements ADD COLUMN note TEXT",
      "ALTER TABLE acknowledgements ADD COLUMN status TEXT",
    ];
    for (const sql of migrations) {
      try {
        db.exec(sql);
        logger.info(`Migration applied: ${sql}`);
      } catch {
        // Column already exists — ignore
      }
    }

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
        Notification,
      ],
      synchronize: false, // Schema is managed manually
      logging: false,
    });

    logger.info("Connecting to database with TypeORM...");
    await dataSource.initialize();
    logger.info("Connected to SQLite database with TypeORM.");

    // Ensure sys-admin account (employee_id=0) exists for auto-approve
    const employeeRepoInit = dataSource.getRepository(Employee);
    const sysAdmin = await employeeRepoInit.findOne({ where: { id: 0 } });
    if (!sysAdmin) {
      await dataSource.query(
        `INSERT OR IGNORE INTO employees (id, name, identifier, pto_rate, carryover_hours, hire_date, role)
         VALUES (0, 'System', 'system', 0, 0, '2000-01-01', 'System')`,
      );
      logger.info("Sys-admin account (id=0) created.");
    }

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

            // Auto-provision if domain is allowed
            if (isAllowedEmailDomain(identifier)) {
              const newEmployee = employeeRepo.create({
                name: identifier,
                identifier,
                hire_date: today(),
                pto_rate: PTO_EARNING_SCHEDULE[0].dailyRate,
                carryover_hours: 0,
                role: "Employee",
              });
              const saved = await employeeRepo.save(newEmployee);
              logger.info(
                `Auto-provisioned new employee: ${identifier} (ID: ${saved.id})`,
              );
              // Fall through to normal magic-link flow with the new employee
              // Re-assign so downstream code uses the newly created record
              Object.assign(req, { _provisionedEmployee: saved });
            } else {
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
          }

          // Use auto-provisioned employee if one was just created
          const resolvedEmployee: Employee =
            employee ?? ((req as any)._provisionedEmployee as Employee);

          logger.info(
            `Login request for user: ${identifier} (Employee ID: ${resolvedEmployee.id})`,
          );

          // Generate secret hash if not exists
          let secretHash = resolvedEmployee.hash;
          if (!secretHash) {
            secretHash = crypto
              .createHash("sha256")
              .update(identifier + process.env.HASH_SALT || "default_salt")
              .digest("hex");
            resolvedEmployee.hash = secretHash;
            await employeeRepo.save(resolvedEmployee);
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
              hireDate: req.employee!.hire_date || "",
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

          // Accept optional ?current_date=YYYY-MM-DD for time-travel testing
          const currentDateParam = req.query.current_date as string | undefined;
          const currentDate =
            currentDateParam && isValidDateString(currentDateParam)
              ? currentDateParam
              : undefined;

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
          const employeeData = {
            id: employee.id,
            name: employee.name,
            identifier: employee.identifier,
            pto_rate: employee.pto_rate,
            carryover_hours: employee.carryover_hours,
            hire_date: employee.hire_date,
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

          const status = calculatePTOStatus(
            employeeData,
            ptoEntriesData,
            currentDate,
          );

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

          // Check if the month is locked by an admin acknowledgement
          if (await rejectIfMonthLocked(res, employeeId, month)) {
            return;
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

          // Check if the month is locked by an admin acknowledgement
          if (await rejectIfMonthLocked(res, employeeId, month)) {
            return;
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

    // Delete employee acknowledgement (unlock)
    app.delete(
      "/api/acknowledgements/:id",
      authenticate(() => dataSource, log),
      async (req, res) => {
        try {
          const { id } = req.params;
          const ackId = parseInt(id as string);
          const employeeId = req.employee!.id;

          if (isNaN(ackId)) {
            return res
              .status(400)
              .json({ error: "Invalid acknowledgement ID" });
          }

          const acknowledgementRepo = dataSource.getRepository(Acknowledgement);
          const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);

          const ack = await acknowledgementRepo.findOne({
            where: { id: ackId },
          });

          if (!ack) {
            return res.status(404).json({ error: "Acknowledgement not found" });
          }

          // Verify ownership
          if (ack.employee_id !== employeeId) {
            return res.status(403).json({ error: "Forbidden" });
          }

          // Check if admin has locked this month
          const adminAck = await adminAckRepo.findOne({
            where: { employee_id: employeeId, month: ack.month },
          });

          if (adminAck) {
            logger.info(
              `Acknowledgement unlock failed: Admin has locked month ${ack.month} for employee ${employeeId}`,
            );
            return res.status(409).json({
              error: "month.admin_locked_cannot_unlock",
              message: VALIDATION_MESSAGES["month.admin_locked_cannot_unlock"],
            });
          }

          await acknowledgementRepo.remove(ack);

          logger.info(
            `Acknowledgement ${ackId} removed for employee ${employeeId}, month ${ack.month}`,
          );
          res.json({ message: "Acknowledgement removed successfully" });
        } catch (error) {
          logger.error(`Error removing acknowledgement: ${error}`);
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

          // Guard: month must have fully ended
          // Accept optional ?current_date=YYYY-MM-DD for time-travel testing
          const currentDateParam = req.query.current_date as
            | string
            | undefined;
          const effectiveToday =
            currentDateParam && isValidDateString(currentDateParam)
              ? currentDateParam
              : today();
          const monthEndedError = validateAdminCanLockMonth(
            monthStr,
            effectiveToday,
          );
          if (monthEndedError) {
            const earliestDate = getEarliestAdminLockDate(monthStr);
            logger.info(
              `Admin acknowledgement submission failed: Month ${monthStr} has not ended yet. Earliest lock date: ${earliestDate}`,
            );
            return res.status(409).json({
              error: "month_not_ended",
              message: formatMonthNotEndedMessage(earliestDate),
              earliestDate,
            });
          }

          // Guard: employee must have acknowledged first
          const acknowledgementRepo = dataSource.getRepository(Acknowledgement);
          const employeeAck = await acknowledgementRepo.findOne({
            where: { employee_id: employeeIdNum, month: monthStr },
          });
          if (!employeeAck) {
            logger.info(
              `Admin acknowledgement submission failed: Employee ${employeeIdNum} has not acknowledged month ${monthStr}`,
            );
            return res.status(409).json({
              error: "employee_not_acknowledged",
              message: VALIDATION_MESSAGES["employee.not_acknowledged"],
            });
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

          // Resolve any warning status on the employee acknowledgement
          if (employeeAck.status === "warning") {
            employeeAck.status = "resolved";
            await acknowledgementRepo.save(employeeAck);
          }

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
          const ackRepo = dataSource.getRepository(Acknowledgement);
          const notificationRepo = dataSource.getRepository(Notification);

          // Get all employees (exclude sys-admin)
          const employees = await employeeRepo.find({
            where: { id: Not(SYS_ADMIN_EMPLOYEE_ID) },
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

            // Check if employee has locked (acknowledged) their calendar
            const employeeAck = await ackRepo.findOne({
              where: { employee_id: employee.id, month: monthStr },
            });

            // Check for calendar_lock_reminder notification for this employee/month
            // Find the most recent notification matching this month (month is embedded in message)
            const lockNotification = await notificationRepo.findOne({
              where: {
                employee_id: employee.id,
                type: "calendar_lock_reminder",
                message: Like(`%${monthStr}%`),
              },
              order: { created_at: "DESC" },
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
              calendarLocked: !!employeeAck,
              notificationSent: !!lockNotification,
              notificationReadAt: lockNotification?.read_at
                ? dateToString(lockNotification.read_at)
                : null,
              employeeAckStatus: employeeAck?.status ?? null,
              employeeAckNote: employeeAck?.note ?? null,
            });
          }

          res.json(result);
        } catch (error) {
          logger.error(`Error getting admin monthly review: ${error}`);
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

          // Exclude sys-admin account from employee listings
          whereCondition.id = Not(SYS_ADMIN_EMPLOYEE_ID);

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
              : PTO_EARNING_SCHEDULE[0].dailyRate;
          employee.carryover_hours =
            carryoverHours !== undefined
              ? typeof carryoverHours === "string"
                ? parseFloat(carryoverHours)
                : carryoverHours
              : 0;
          employee.hire_date = hireDate || today();
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
          if (hireDate !== undefined) employee.hire_date = hireDate;
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
    // Termination payout calculation endpoint (admin-only)
    app.get(
      "/api/employees/:id/termination-payout",
      authenticateAdmin(() => dataSource, log),
      async (req, res) => {
        try {
          const { id } = req.params;
          const employeeIdNum = parseInt(id as string);

          if (isNaN(employeeIdNum)) {
            return res.status(400).json({ error: "Invalid employee ID" });
          }

          const employeeRepo = dataSource.getRepository(Employee);
          const ptoEntryRepo = dataSource.getRepository(PtoEntry);

          const employee = await employeeRepo.findOne({
            where: { id: employeeIdNum },
          });
          if (!employee) {
            return res.status(404).json({ error: "Employee not found" });
          }

          const hireDate = employee.hire_date;

          // Accept optional ?current_date=YYYY-MM-DD for time-travel testing
          const currentDateParam = req.query.current_date as
            | string
            | undefined;
          const currentDate =
            currentDateParam && isValidDateString(currentDateParam)
              ? currentDateParam
              : today();
          const currentYear = parseInt(currentDate.split("-")[0]);

          // Carryover from previous year
          const carryoverHours = computeCarryover(employee.carryover_hours);

          // Current year accrued
          const jan1 = `${currentYear}-01-01`;
          const currentYearAccrued = computeAccrualWithHireDate(
            hireDate,
            jan1,
            currentDate,
          );

          // Current year used PTO
          const startDate = `${currentYear}-01-01`;
          const endDate = `${currentYear}-12-31`;
          const ptoEntries = await ptoEntryRepo.find({
            where: {
              employee_id: employeeIdNum,
              type: "PTO",
              date: Between(startDate, endDate),
            },
          });
          const currentYearUsed = ptoEntries.reduce(
            (sum, e) => sum + e.hours,
            0,
          );

          const payoutHours = computeTerminationPayout(
            carryoverHours,
            currentYearAccrued,
            currentYearUsed,
          );

          res.json({
            employeeId: employeeIdNum,
            employeeName: employee.name,
            hireDate,
            calculationDate: currentDate,
            breakdown: {
              carryoverHours,
              cappedCarryover: computeCarryover(carryoverHours),
              currentYearAccrued: Math.round(currentYearAccrued * 100) / 100,
              currentYearUsed,
            },
            payoutHours: Math.round(payoutHours * 100) / 100,
          });
        } catch (error) {
          logger.error(`Error computing termination payout: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

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
          const { type, startDate, endDate, employeeId, excludeLockedMonths } =
            req.query;
          const ptoEntryRepo = dataSource.getRepository(PtoEntry);

          let whereCondition: any = {};

          if (employeeId) {
            whereCondition.employee_id = parseInt(employeeId as string, 10);
          }

          if (type) {
            whereCondition.type = type;
          }

          if (startDate && endDate) {
            whereCondition.date = Between(
              startDate as string,
              endDate as string,
            );
          } else if (startDate) {
            whereCondition.date = Between(startDate as string, "9999-12-31");
          } else if (endDate) {
            whereCondition.date = Between("0000-01-01", endDate as string);
          }

          let ptoEntries = await ptoEntryRepo.find({
            where: whereCondition,
            order: { date: "DESC" },
          });

          // When excludeLockedMonths is set, remove entries whose
          // employee+month combination has an admin acknowledgement.
          // This prevents unapproved historic entries in locked months
          // from appearing in the PTO Request Queue.
          if (excludeLockedMonths === "true") {
            const adminAckRepo =
              dataSource.getRepository(AdminAcknowledgement);
            const adminAcks = await adminAckRepo.find();
            const lockedKeys = new Set(
              adminAcks.map(
                (ack) => `${ack.employee_id}:${ack.month}`,
              ),
            );
            ptoEntries = ptoEntries.filter((entry) => {
              const entryMonth = entry.date.slice(0, 7);
              return !lockedKeys.has(
                `${entry.employee_id}:${entryMonth}`,
              );
            });
          }

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

          if (startDate && endDate) {
            whereCondition.date = Between(
              startDate as string,
              endDate as string,
            );
          } else if (startDate) {
            whereCondition.date = Between(startDate as string, "9999-12-31");
          } else if (endDate) {
            whereCondition.date = Between("0000-01-01", endDate as string);
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

            // Check if the month is locked by an admin acknowledgement
            const reqMonth = reqDate.substring(0, 7); // YYYY-MM
            if (await rejectIfMonthLocked(res, empIdNum, reqMonth)) {
              return;
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

          // Collect soft warnings for sick-day threshold
          const warnings: string[] = [];
          if (
            results.some(
              (entry) => entry.type === "Sick" || entry.type === "PTO",
            )
          ) {
            try {
              // Get total sick hours for the year for the affected employee
              const yearOfEntry = lastResult.date.substring(0, 4);
              const sickEntries = await ptoEntryRepo.find({
                where: {
                  employee_id: lastResult.employee_id,
                  type: "Sick",
                  date: Between(`${yearOfEntry}-01-01`, `${yearOfEntry}-12-31`),
                },
              });
              const totalSickHours = sickEntries.reduce(
                (sum, e) => sum + e.hours,
                0,
              );
              const sickWarning = checkSickDayThreshold(totalSickHours, 0);
              if (sickWarning) {
                warnings.push(sickWarning);
              }
            } catch {
              // Non-critical — skip warning on error
            }
          }

          const response: PTOCreateResponse = {
            message: SUCCESS_MESSAGES["pto.created"],
            ptoEntry: serializePTOEntry(lastResult),
          };

          logger.info(
            `PTO entry created: Employee ${lastResult.employee_id}, Date ${lastResult.date}, Type ${lastResult.type}, Hours ${lastResult.hours}`,
          );

          res
            .status(201)
            .json(warnings.length > 0 ? { ...response, warnings } : response);
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

          // Check if the month is locked by an admin acknowledgement
          const entryMonth = ptoEntry.date.substring(0, 7); // YYYY-MM
          if (
            await rejectIfMonthLocked(res, ptoEntry.employee_id, entryMonth)
          ) {
            return;
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

          // Check if the month is locked by an admin acknowledgement
          const deleteMonth = ptoEntry.date.substring(0, 7); // YYYY-MM
          if (
            await rejectIfMonthLocked(res, ptoEntry.employee_id, deleteMonth)
          ) {
            return;
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
          // Accept optional ?current_year for time-travel testing
          const currentYearParam = req.query.current_year as
            | string
            | undefined;
          const currentYear = currentYearParam
            ? parseInt(currentYearParam)
            : parseInt(today().split("-")[0]);
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

    // ── Admin Report Download ──

    app.get(
      "/api/admin/report",
      authenticateAdmin(() => dataSource, log),
      async (req: Request, res: Response) => {
        logger.info(
          `API access: ${req.method} ${req.path} by employee ${req.employee!.id}`,
        );
        try {
          const format = (req.query.format as string) || "html";
          const yearParam = req.query.year as string | undefined;
          const year = yearParam
            ? parseInt(yearParam, 10)
            : new Date().getFullYear();

          if (isNaN(year) || year < 2000 || year > 2100) {
            return res.status(400).json({
              error: "Invalid year parameter. Must be between 2000 and 2100.",
            });
          }

          const validFormats = ["html", "excel", "csv", "json"];
          if (!validFormats.includes(format)) {
            return res.status(400).json({
              error: `Invalid format "${format}". Supported: ${validFormats.join(", ")}`,
            });
          }

          if (format !== "html" && format !== "excel") {
            return res.status(501).json({
              error: `Format "${format}" is not yet implemented. Only "html" and "excel" are currently supported.`,
            });
          }

          const reportData = await assembleReportData(dataSource, year);

          // Save to reports/ for developer review
          const reportsDir = path.join(process.cwd(), "reports");
          if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
          }

          if (format === "excel") {
            const buffer = await generateExcelReport(reportData);
            fs.writeFileSync(
              path.join(reportsDir, `pto-report-${year}.xlsx`),
              buffer,
            );
            res.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            );
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="pto-report-${year}.xlsx"`,
            );
            res.send(buffer);
          } else {
            const html = generateHtmlReport(reportData);
            fs.writeFileSync(
              path.join(reportsDir, `pto-report-${year}.html`),
              html,
              "utf-8",
            );
            res.setHeader("Content-Type", "text/html; charset=utf-8");
            res.setHeader(
              "Content-Disposition",
              `attachment; filename="pto-report-${year}.html"`,
            );
            res.send(html);
          }
        } catch (error) {
          logger.error(`Error generating report: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // ── Admin Excel Import ──

    const excelUpload = multer({
      storage: multer.diskStorage({
        destination: "/tmp",
        filename: (_req, file, cb) => {
          cb(null, `excel-import-${Date.now()}-${file.originalname}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        if (
          file.mimetype ===
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          file.originalname.endsWith(".xlsx")
        ) {
          cb(null, true);
        } else {
          cb(new Error("Only .xlsx files are allowed"));
        }
      },
    });

    app.post(
      "/api/admin/import-excel",
      authenticateAdmin(() => dataSource, log),
      excelUpload.single("file"),
      async (req: Request, res: Response) => {
        logger.info(
          `API access: ${req.method} ${req.path} by employee ${req.employee!.id}`,
        );
        try {
          const file = (req as any).file;
          if (!file) {
            return res.status(400).json({
              error: "No file uploaded. Send an .xlsx file as 'file' field.",
            });
          }

          const adminId = req.employee!.id;
          const filePath = file.path;
          try {
            const result = await importExcelWorkbook(
              dataSource,
              filePath,
              adminId,
              (msg: string) => logger.info(`[Excel Import] ${msg}`),
            );

            logger.info(
              `Excel import completed: ${result.employeesProcessed} employees, ${result.ptoEntriesUpserted} PTO entries (${result.ptoEntriesAutoApproved} auto-approved)`,
            );

            res.json({
              message: `Import complete: ${result.employeesProcessed} employees processed (${result.employeesCreated} created), ${result.ptoEntriesUpserted} PTO entries upserted (${result.ptoEntriesAutoApproved} auto-approved), ${result.acknowledgementsSynced} acknowledgements synced.`,
              ...result,
            });
          } finally {
            // Clean up temp file
            fs.unlink(filePath, () => {});
          }
        } catch (error) {
          logger.error(`Error importing Excel: ${error}`);
          res.status(500).json({ error: "Failed to import Excel file" });
        }
      },
    );

    // ── Notification routes ──

    // ── Bulk JSON Import (browser-side parsed) ──
    // POST /api/admin/import-bulk
    // Accepts a BulkImportPayload (JSON) with pre-parsed employee data.
    // This avoids server-side ExcelJS processing (which causes OOM on 512MB).
    app.post(
      "/api/admin/import-bulk",
      authenticateAdmin(() => dataSource, log),
      async (req: Request, res: Response) => {
        logger.info(
          `API access: ${req.method} ${req.path} by employee ${req.employee!.id}`,
        );
        try {
          const { employees } = req.body;
          if (!Array.isArray(employees) || employees.length === 0) {
            return res.status(400).json({
              error:
                "Invalid payload. Expected { employees: [...] } with at least one employee.",
            });
          }

          const adminId = req.employee!.id;
          const result = {
            employeesProcessed: 0,
            employeesCreated: 0,
            ptoEntriesUpserted: 0,
            ptoEntriesAutoApproved: 0,
            acknowledgementsSynced: 0,
            warnings: [] as string[],
            errors: [] as string[],
            resolved: [] as string[],
            perEmployee: [] as {
              name: string;
              employeeId: number;
              ptoEntries: number;
              ptoEntriesAutoApproved: number;
              acknowledgements: number;
              created: boolean;
            }[],
          };

          // Disable autoSave for bulk operations (sql.js performance)
          const driver = dataSource.driver as any;
          const originalAutoSave = driver.options?.autoSave;
          if (driver.options) {
            driver.options.autoSave = false;
            logger.info("[Bulk Import] autoSave disabled");
          }

          try {
            for (const emp of employees) {
              try {
                result.employeesProcessed++;

                // Validate required employee fields
                if (!emp.name || typeof emp.name !== "string") {
                  result.warnings.push(
                    `Skipped employee with missing/invalid name`,
                  );
                  continue;
                }

                // Upsert employee
                const { employeeId, created } = await upsertEmployee(
                  dataSource,
                  {
                    name: emp.name,
                    hireDate: emp.hireDate || "",
                    year: emp.ptoEntries?.[0]
                      ? parseInt(emp.ptoEntries[0].date?.substring(0, 4), 10) ||
                        0
                      : 0,
                    carryoverHours: emp.carryoverHours || 0,
                    spreadsheetPtoRate: emp.ptoRate || 0,
                  },
                  (msg: string) => logger.info(`[Bulk Import] ${msg}`),
                );
                if (created) result.employeesCreated++;

                // Upsert PTO entries (with auto-approve context when enabled)
                const ptoEntries = Array.isArray(emp.ptoEntries)
                  ? emp.ptoEntries
                  : [];

                // Build auto-approve context from import payload
                const acknowledgements = Array.isArray(emp.acknowledgements)
                  ? emp.acknowledgements
                  : [];

                const autoApproveCtx: AutoApproveImportContext | undefined =
                  ENABLE_IMPORT_AUTO_APPROVE && emp.hireDate
                    ? {
                        hireDate: emp.hireDate,
                        carryoverHours: emp.carryoverHours || 0,
                      }
                    : undefined;

                const { upserted, autoApproved: empAutoApproved, warnings: ptoWarnings } =
                  await upsertPtoEntries(dataSource, employeeId, ptoEntries, autoApproveCtx);
                result.ptoEntriesUpserted += upserted;
                result.ptoEntriesAutoApproved += empAutoApproved;
                result.warnings.push(...ptoWarnings);

                // Upsert acknowledgements
                const acksSynced = await upsertAcknowledgements(
                  dataSource,
                  employeeId,
                  acknowledgements,
                  adminId,
                );
                result.acknowledgementsSynced += acksSynced;

                // Collect per-sheet warnings, errors, and resolved
                if (Array.isArray(emp.warnings)) {
                  result.warnings.push(...emp.warnings);
                }
                if (Array.isArray(emp.errors)) {
                  result.errors.push(...emp.errors);
                }
                if (Array.isArray(emp.resolved)) {
                  result.resolved.push(...emp.resolved);
                }

                result.perEmployee.push({
                  name: emp.name,
                  employeeId,
                  ptoEntries: upserted,
                  ptoEntriesAutoApproved: empAutoApproved,
                  acknowledgements: acksSynced,
                  created,
                });

                logger.info(
                  `[Bulk Import] ${created ? "Created" : "Updated"} "${emp.name}" id=${employeeId}, ` +
                    `${upserted} PTO entries (${empAutoApproved} auto-approved), ${acksSynced} acknowledgements`,
                );
              } catch (empError) {
                const msg = `Failed to process employee "${emp.name || "unknown"}": ${empError}`;
                logger.error(`[Bulk Import] ${msg}`);
                result.errors.push(msg);
              }
            }
          } finally {
            // Restore autoSave and persist once
            if (driver.options) {
              driver.options.autoSave = originalAutoSave;
              logger.info("[Bulk Import] autoSave restored");
            }
            if (typeof driver.save === "function") {
              await driver.save();
              logger.info("[Bulk Import] database saved");
            }
          }

          logger.info(
            `Bulk import completed: ${result.employeesProcessed} employees, ${result.ptoEntriesUpserted} PTO entries (${result.ptoEntriesAutoApproved} auto-approved)`,
          );

          res.json({
            message: `Import complete: ${result.employeesProcessed} employees processed (${result.employeesCreated} created), ${result.ptoEntriesUpserted} PTO entries upserted (${result.ptoEntriesAutoApproved} auto-approved), ${result.acknowledgementsSynced} acknowledgements synced.`,
            ...result,
          });
        } catch (error) {
          logger.error(`Error in bulk import: ${error}`);
          res.status(500).json({ error: "Failed to process bulk import" });
        }
      },
    );

    // ── Employee Timesheet Upload (browser-side parsed, single employee) ──
    // POST /api/employee/import-bulk
    // Accepts browser-parsed PTO entries for the authenticated employee only.
    // Validates identity (name + hire date), checks admin-locked months,
    // overwrites unlocked months, and returns per-month breakdown.
    app.post(
      "/api/employee/import-bulk",
      authenticate(() => dataSource, log),
      async (req: Request, res: Response) => {
        logger.info(
          `API access: ${req.method} ${req.path} by employee ${req.employee!.id}`,
        );
        try {
          const { employeeName, hireDate, year, ptoEntries, acknowledgements } =
            req.body as {
              employeeName: string;
              hireDate: string;
              year: number;
              ptoEntries: Array<{
                date: string;
                hours: number;
                type: string;
                notes?: string | null;
                isNoteDerived?: boolean;
              }>;
              acknowledgements: Array<{
                month: string;
                type: string;
                note?: string | null;
                status?: string | null;
              }>;
            };

          // Basic payload validation
          if (
            !employeeName ||
            !hireDate ||
            !year ||
            !Array.isArray(ptoEntries)
          ) {
            return res.status(400).json({
              error:
                "Invalid payload. Required: employeeName, hireDate, year, ptoEntries[].",
            });
          }

          const employee = req.employee!;
          const employeeId = employee.id;

          // ── Identity verification (server-side) ──
          const empRepo = dataSource.getRepository(Employee);
          const dbEmployee = await empRepo.findOne({
            where: { id: employeeId },
          });
          if (!dbEmployee) {
            return res.status(404).json({ error: "Employee not found." });
          }

          const normalize = (s: string) =>
            s.trim().replace(/\s+/g, " ").toLowerCase();
          const dbName = normalize(dbEmployee.name);
          const sheetName = normalize(employeeName);
          if (dbName !== sheetName) {
            return res.status(403).json({
              error: `Spreadsheet name "${employeeName}" does not match your account name "${dbEmployee.name}".`,
            });
          }

          // Normalize hire date — db format is YYYY-MM-DD, sheet may be M/D/YY etc.
          const dbHireDate = dbEmployee.hire_date || "";
          if (dbHireDate && hireDate && dbHireDate !== hireDate) {
            return res.status(403).json({
              error: `Spreadsheet hire date "${hireDate}" does not match your account hire date "${dbHireDate}".`,
            });
          }

          // ── Per-month admin-lock check & import ──
          const ptoRepo = dataSource.getRepository(PtoEntry);
          const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);
          const ackRepo = dataSource.getRepository(Acknowledgement);
          const perMonth: Array<{
            month: string;
            status: "imported" | "skipped-locked";
            entriesImported: number;
            entriesDeleted: number;
            warnings: string[];
          }> = [];
          const allWarnings: string[] = [];
          let totalImported = 0;
          let totalDeleted = 0;

          // Disable autoSave for bulk operation (sql.js performance)
          const driver = dataSource.driver as any;
          const originalAutoSave = driver.options?.autoSave;
          if (driver.options) {
            driver.options.autoSave = false;
          }

          try {
            for (let m = 1; m <= 12; m++) {
              const monthStr = `${year}-${m < 10 ? "0" + m : m}`;
              const monthWarnings: string[] = [];

              // Check admin lock
              const adminAck = await adminAckRepo.findOne({
                where: { employee_id: employeeId, month: monthStr },
              });
              if (adminAck) {
                perMonth.push({
                  month: monthStr,
                  status: "skipped-locked",
                  entriesImported: 0,
                  entriesDeleted: 0,
                  warnings: [],
                });
                continue;
              }

              // Find PTO entries for this month from the payload
              const monthEntries = ptoEntries.filter(
                (e) =>
                  e.date &&
                  e.date.startsWith(monthStr),
              );

              // Delete existing entries for this month (full overwrite)
              const existingEntries = await ptoRepo.find({
                where: {
                  employee_id: employeeId,
                  date: Between(`${monthStr}-01`, `${monthStr}-31`),
                },
              });
              const deletedCount = existingEntries.length;
              if (deletedCount > 0) {
                await ptoRepo.remove(existingEntries);
              }

              // Insert new entries (unapproved — approved_by = null)
              let insertedCount = 0;
              for (const entry of monthEntries) {
                const validTypes = ["PTO", "Sick", "Bereavement", "Jury Duty"] as const;
                type PtoType = (typeof validTypes)[number];
                const entryType: PtoType = validTypes.includes(entry.type as PtoType)
                  ? (entry.type as PtoType)
                  : "PTO";

                const ptoEntry = ptoRepo.create({
                  employee_id: employeeId,
                  date: entry.date,
                  type: entryType,
                  hours: entry.hours,
                  notes: entry.notes || null,
                  approved_by: null,
                });
                await ptoRepo.save(ptoEntry);
                insertedCount++;
              }

              // Upsert employee acknowledgement for this month (from column X)
              const empAck = (acknowledgements || []).find(
                (a) => a.month === monthStr && a.type === "employee",
              );
              if (empAck) {
                const existing = await ackRepo.findOne({
                  where: { employee_id: employeeId, month: monthStr },
                });
                if (!existing) {
                  const newAck = ackRepo.create({
                    employee_id: employeeId,
                    month: monthStr,
                    acknowledged_at: new Date(),
                  });
                  await ackRepo.save(newAck);
                }
              }

              // Business rule warnings (non-blocking)
              // Check annual usage for the year so far
              const yearStart = `${year}-01-01`;
              const yearEnd = `${year}-12-31`;
              const allYearEntries = await ptoRepo.find({
                where: {
                  employee_id: employeeId,
                  date: Between(yearStart, yearEnd),
                },
              });
              const annualUsage: Record<string, number> = {
                PTO: 0,
                Sick: 0,
                Bereavement: 0,
                "Jury Duty": 0,
              };
              for (const e of allYearEntries) {
                if (e.type in annualUsage) {
                  annualUsage[e.type] += e.hours;
                }
              }

              if (
                annualUsage["Sick"] >
                BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK
              ) {
                monthWarnings.push(
                  `Sick hours (${annualUsage["Sick"]}h) exceed annual limit of ${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK}h.`,
                );
              }
              if (
                annualUsage["Bereavement"] >
                BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT
              ) {
                monthWarnings.push(
                  `Bereavement hours (${annualUsage["Bereavement"]}h) exceed annual limit of ${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT}h.`,
                );
              }
              if (
                annualUsage["Jury Duty"] >
                BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY
              ) {
                monthWarnings.push(
                  `Jury Duty hours (${annualUsage["Jury Duty"]}h) exceed annual limit of ${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY}h.`,
                );
              }

              totalImported += insertedCount;
              totalDeleted += deletedCount;
              allWarnings.push(...monthWarnings);

              perMonth.push({
                month: monthStr,
                status: "imported",
                entriesImported: insertedCount,
                entriesDeleted: deletedCount,
                warnings: monthWarnings,
              });
            }
          } finally {
            // Restore autoSave and persist once
            if (driver.options) {
              driver.options.autoSave = originalAutoSave;
            }
            if (typeof driver.save === "function") {
              await driver.save();
            }
          }

          // If all months were locked, return 409
          const importedMonths = perMonth.filter(
            (m) => m.status === "imported",
          );
          if (importedMonths.length === 0) {
            return res.status(409).json({
              error:
                "All months in the uploaded year are admin-locked. No data was imported.",
              perMonth,
            });
          }

          const lockedMonths = perMonth.filter(
            (m) => m.status === "skipped-locked",
          );
          const lockedSummary =
            lockedMonths.length > 0
              ? ` (${lockedMonths.length} month(s) skipped — admin-locked)`
              : "";

          logger.info(
            `Employee import by #${employeeId}: ${totalImported} entries imported, ${totalDeleted} deleted${lockedSummary}`,
          );

          res.json({
            message: `Import complete: ${totalImported} entries imported, ${totalDeleted} replaced${lockedSummary}.`,
            perMonth,
            totalEntriesImported: totalImported,
            totalEntriesDeleted: totalDeleted,
            warnings: allWarnings,
          });
        } catch (error) {
          logger.error(`Error in employee import: ${error}`);
          res.status(500).json({ error: "Failed to process timesheet import" });
        }
      },
    );

    // Create a notification for a specific employee (admin-only)
    app.post(
      "/api/notifications",
      authenticateAdmin(() => dataSource, log),
      async (req: Request, res: Response) => {
        try {
          if (!isNotificationCreateRequest(req.body)) {
            return res.status(400).json({
              error:
                "Invalid request body. Required: employeeId (number), type (string), message (string)",
            });
          }

          const { employeeId, type, message } = req.body;

          // Validate notification type
          const validTypes = ["calendar_lock_reminder", "system"];
          if (!validTypes.includes(type)) {
            return res.status(400).json({
              error: `Invalid notification type. Must be one of: ${validTypes.join(", ")}`,
            });
          }

          // Verify target employee exists
          const employeeRepo = dataSource.getRepository(Employee);
          const targetEmployee = await employeeRepo.findOne({
            where: { id: employeeId },
          });
          if (!targetEmployee) {
            return res.status(404).json({ error: "Employee not found" });
          }

          // Duplicate prevention: check for existing unread notification of same type for same employee
          const notificationRepo = dataSource.getRepository(Notification);
          const existing = await notificationRepo.findOne({
            where: {
              employee_id: employeeId,
              type,
              read_at: IsNull(),
            },
          });
          if (existing) {
            return res.status(409).json({
              error:
                "An unread notification of this type already exists for this employee",
            });
          }

          // Compute expiry date
          const expiresAt = new Date();
          expiresAt.setDate(
            expiresAt.getDate() +
              BUSINESS_RULES_CONSTANTS.NOTIFICATION_EXPIRY_DAYS,
          );

          const adminId = (req as any).employee?.id;

          const notification = notificationRepo.create({
            employee_id: employeeId,
            type,
            message,
            created_by: adminId ?? null,
            expires_at: expiresAt,
          });

          await notificationRepo.save(notification);

          logger.info(
            `Notification created: type=${type}, employee=${employeeId}, by admin=${adminId}`,
          );

          res.status(201).json({
            message: "Notification created successfully",
            notification: {
              id: notification.id,
              employee_id: notification.employee_id,
              type: notification.type,
              message: notification.message,
              created_at: notification.created_at,
              read_at: notification.read_at,
              expires_at: notification.expires_at,
              created_by: notification.created_by,
            },
          });
        } catch (error) {
          logger.error(`Error creating notification: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Get unread notifications for the authenticated user
    app.get(
      "/api/notifications",
      authenticate(() => dataSource, log),
      async (req: Request, res: Response) => {
        try {
          const employeeId = (req as any).employee?.id;
          if (!employeeId) {
            return res.status(401).json({ error: "Unauthorized" });
          }

          const notificationRepo = dataSource.getRepository(Notification);
          const now = new Date();

          // Fetch unread notifications that haven't expired
          const notifications = await notificationRepo.find({
            where: {
              employee_id: employeeId,
              read_at: IsNull(),
            },
            order: { created_at: "DESC" },
          });

          // Filter out expired notifications in application code
          const validNotifications = notifications.filter((n) => {
            if (!n.expires_at) return true;
            const expiresAt =
              n.expires_at instanceof Date
                ? n.expires_at
                : new Date(n.expires_at);
            return expiresAt > now;
          });

          res.json({
            notifications: validNotifications.map((n) => ({
              id: n.id,
              employee_id: n.employee_id,
              type: n.type,
              message: n.message,
              created_at: n.created_at,
              read_at: n.read_at,
              expires_at: n.expires_at,
              created_by: n.created_by,
            })),
          });
        } catch (error) {
          logger.error(`Error fetching notifications: ${error}`);
          res.status(500).json({ error: "Internal server error" });
        }
      },
    );

    // Mark a notification as read
    app.patch(
      "/api/notifications/:id/read",
      authenticate(() => dataSource, log),
      async (req: Request, res: Response) => {
        try {
          const { id } = req.params;
          const notificationId = parseInt(id as string);

          if (isNaN(notificationId)) {
            return res.status(400).json({ error: "Invalid notification ID" });
          }

          const employeeId = (req as any).employee?.id;
          if (!employeeId) {
            return res.status(401).json({ error: "Unauthorized" });
          }

          const notificationRepo = dataSource.getRepository(Notification);
          const notification = await notificationRepo.findOne({
            where: { id: notificationId, employee_id: employeeId },
          });

          if (!notification) {
            return res.status(404).json({ error: "Notification not found" });
          }

          notification.read_at = new Date();
          await notificationRepo.save(notification);

          logger.info(
            `Notification ${notificationId} marked as read by employee ${employeeId}`,
          );

          res.json({
            message: "Notification marked as read",
            notification: {
              id: notification.id,
              employee_id: notification.employee_id,
              type: notification.type,
              message: notification.message,
              created_at: notification.created_at,
              read_at: notification.read_at,
              expires_at: notification.expires_at,
              created_by: notification.created_by,
            },
          });
        } catch (error) {
          logger.error(`Error marking notification as read: ${error}`);
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
