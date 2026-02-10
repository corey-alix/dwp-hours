import { DurableObject } from "cloudflare:workers";
import initSqlJs from "sql.js";
import { DataSource, Not, IsNull } from "typeorm";
import { Employee } from "../../server/entities/Employee.js";
import { PtoEntry } from "../../server/entities/PtoEntry.js";
import { MonthlyHours } from "../../server/entities/MonthlyHours.js";
import { Acknowledgement } from "../../server/entities/Acknowledgement.js";
import { AdminAcknowledgement } from "../../server/entities/AdminAcknowledgement.js";
import { createHash } from "crypto";
import {
  calculatePTOStatus,
  validateHours,
  validateWeekday,
  validatePTOType,
  validateDateString,
} from "../../shared/businessRules.js";

// SendGrid integration
const SENDGRID_API_KEY = "your-sendgrid-api-key"; // Set in environment
const FROM_EMAIL = "noreply@yourapp.com";

// Embedded database schema
const DATABASE_SCHEMA =
  "-- Enable foreign key constraints\n" +
  "PRAGMA foreign_keys = ON;\n\n" +
  "-- Create employees table\n" +
  "CREATE TABLE IF NOT EXISTS employees (\n" +
  "  id INTEGER PRIMARY KEY AUTOINCREMENT,\n" +
  "  name TEXT NOT NULL,\n" +
  "  identifier TEXT UNIQUE NOT NULL,\n" +
  "  pto_rate REAL DEFAULT 0.71,\n" +
  "  carryover_hours REAL DEFAULT 0,\n" +
  "  hire_date DATE NOT NULL,\n" +
  "  role TEXT DEFAULT 'Employee',\n" +
  "  hash TEXT\n" +
  ");\n\n" +
  "-- Create PTO entries table\n" +
  "CREATE TABLE IF NOT EXISTS pto_entries (\n" +
  "  id INTEGER PRIMARY KEY AUTOINCREMENT,\n" +
  "  employee_id INTEGER NOT NULL,\n" +
  "  date TEXT NOT NULL,\n" +
  "  type TEXT NOT NULL CHECK (type IN ('Sick', 'PTO', 'Bereavement', 'Jury Duty')),\n" +
  "  hours REAL NOT NULL,\n" +
  "  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n" +
  "  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE\n" +
  ");\n\n" +
  "-- Create indexes for better performance\n" +
  "CREATE INDEX IF NOT EXISTS idx_pto_entries_employee_id ON pto_entries(employee_id);\n" +
  "CREATE INDEX IF NOT EXISTS idx_pto_entries_date ON pto_entries(date);\n\n" +
  "-- Create monthly hours table\n" +
  "CREATE TABLE IF NOT EXISTS monthly_hours (\n" +
  "  id INTEGER PRIMARY KEY AUTOINCREMENT,\n" +
  "  employee_id INTEGER NOT NULL,\n" +
  "  month TEXT NOT NULL,\n" +
  "  hours_worked REAL NOT NULL,\n" +
  "  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n" +
  "  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE\n" +
  ");\n\n" +
  "-- Create acknowledgements table\n" +
  "CREATE TABLE IF NOT EXISTS acknowledgements (\n" +
  "  id INTEGER PRIMARY KEY AUTOINCREMENT,\n" +
  "  employee_id INTEGER NOT NULL,\n" +
  "  month TEXT NOT NULL,\n" +
  "  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n" +
  "  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE\n" +
  ");\n\n" +
  "-- Create indexes for monthly hours\n" +
  "CREATE INDEX IF NOT EXISTS idx_monthly_hours_employee_id ON monthly_hours(employee_id);\n" +
  "CREATE INDEX IF NOT EXISTS idx_monthly_hours_month ON monthly_hours(month);\n\n" +
  "-- Create indexes for acknowledgements\n" +
  "CREATE INDEX IF NOT EXISTS idx_acknowledgements_employee_id ON acknowledgements(employee_id);\n" +
  "CREATE INDEX IF NOT EXISTS idx_acknowledgements_month ON acknowledgements(month);\n\n" +
  "-- Create admin acknowledgements table\n" +
  "CREATE TABLE IF NOT EXISTS admin_acknowledgements (\n" +
  "  id INTEGER PRIMARY KEY AUTOINCREMENT,\n" +
  "  employee_id INTEGER NOT NULL,\n" +
  "  month TEXT NOT NULL,\n" +
  "  admin_id INTEGER NOT NULL,\n" +
  "  acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n" +
  "  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,\n" +
  "  FOREIGN KEY (admin_id) REFERENCES employees(id) ON DELETE CASCADE\n" +
  ");\n\n" +
  "-- Create indexes for admin acknowledgements\n" +
  "CREATE INDEX IF NOT EXISTS idx_admin_acknowledgements_employee_id ON admin_acknowledgements(employee_id);\n" +
  "CREATE INDEX IF NOT EXISTS idx_admin_acknowledgements_admin_id ON admin_acknowledgements(admin_id);\n" +
  "CREATE INDEX IF NOT EXISTS idx_admin_acknowledgements_month ON admin_acknowledgements(month);\n\n" +
  "-- Create sessions table\n" +
  "CREATE TABLE IF NOT EXISTS sessions (\n" +
  "  token TEXT PRIMARY KEY,\n" +
  "  employee_id INTEGER NOT NULL,\n" +
  "  expires_at DATETIME NOT NULL,\n" +
  "  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE\n" +
  ");\n\n" +
  "-- Create indexes for sessions\n" +
  "CREATE INDEX IF NOT EXISTS idx_sessions_employee_id ON sessions(employee_id);\n" +
  "CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);";

interface Env {
  DB_BUCKET: R2Bucket; // For storing the SQLite file
  SENDGRID_API_KEY: string;
  FROM_EMAIL: string;
  HASH_SALT: string;
}

export class DwpHoursDO extends DurableObject<Env> {
  private db: initSqlJs.Database | null = null;
  private dataSource: DataSource | null = null;
  private SQL: initSqlJs.SqlJsStatic | null = null;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async initializeDatabase() {
    if (this.db) return; // Already initialized

    try {
      // Load SQL.js
      this.SQL = await initSqlJs();

      // Try to load existing database from R2
      let filebuffer: Uint8Array | undefined;
      try {
        const dbObject = await this.env.DB_BUCKET.get("dwp-hours.db");
        if (dbObject) {
          filebuffer = new Uint8Array(await dbObject.arrayBuffer());
        }
      } catch (error) {
        console.log("No existing database in R2, creating new one");
      }

      // Create database instance
      this.db = new this.SQL.Database(filebuffer);

      // Execute schema if new database
      if (!filebuffer) {
        this.db.exec(DATABASE_SCHEMA);
      }

      // Initialize TypeORM
      this.dataSource = new DataSource({
        type: "sqljs",
        location: "dwp-hours.db",
        autoSave: true,
        entities: [
          Employee,
          PtoEntry,
          MonthlyHours,
          Acknowledgement,
          AdminAcknowledgement,
        ],
        synchronize: false,
      });

      await this.dataSource.initialize();

      // Save initial database to R2
      await this.saveDatabaseToR2();
    } catch (error) {
      console.error("Database initialization failed:", error);
      throw error;
    }
  }

  async saveDatabaseToR2() {
    if (!this.db) return;

    try {
      // Export database to Uint8Array
      const dbData = this.db.export();
      const dbBuffer = dbData.buffer.slice(
        dbData.byteOffset,
        dbData.byteOffset + dbData.byteLength,
      );

      // Convert to ArrayBuffer for R2 compatibility
      const arrayBuffer = new ArrayBuffer(dbBuffer.byteLength);
      new Uint8Array(arrayBuffer).set(new Uint8Array(dbBuffer));

      // Save to R2
      await this.env.DB_BUCKET.put("dwp-hours.db", arrayBuffer);
      console.log("Database saved to R2");
    } catch (error) {
      console.error("Failed to save database to R2:", error);
    }
  }

  // Main request handler
  async handleSession(request: Request): Promise<Response> {
    await this.initializeDatabase();

    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // CORS headers for cross-origin requests
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*", // Configure for your Pages domain
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
      "Access-Control-Allow-Credentials": "true",
    };

    // Handle preflight OPTIONS requests
    if (method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Route handling
      const routeKey = `${method} ${path}`;

      switch (routeKey) {
        case "POST /api/auth/logout":
          return this.handleLogout(corsHeaders);

        case "POST /api/auth/request-link":
          return this.handleRequestMagicLink(request, corsHeaders);

        case "GET /api/auth/validate":
          return this.handleValidateToken(request, corsHeaders);

        case "GET /api/health":
          return this.handleHealth(corsHeaders);

        case "GET /api/version":
          return this.handleVersion(corsHeaders);

        case "GET /api/pto/status":
          return this.handleGetPtoStatus(request, corsHeaders);

        case "GET /api/pto":
          return this.handleGetPtoEntries(request, corsHeaders);

        case "POST /api/pto":
          return this.handleCreatePtoEntry(request, corsHeaders);

        // Add other routes here...

        default:
          return new Response("Not Found", {
            status: 404,
            headers: corsHeaders,
          });
      }
    } catch (error) {
      console.error("Request error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  async handleRequestMagicLink(
    request: Request,
    corsHeaders: Record<string, string>,
  ): Promise<Response> {
    const body = (await request.json().catch(() => ({}))) as {
      identifier?: string;
    };

    if (!body.identifier || typeof body.identifier !== "string") {
      return new Response(JSON.stringify({ error: "Valid email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { identifier } = body;

    const employeeRepo = this.dataSource!.getRepository(Employee);
    const employee = await employeeRepo.findOne({ where: { identifier } });

    if (!employee) {
      // For security, don't reveal if user exists
      return new Response(
        JSON.stringify({
          message: "If the email exists, a magic link has been sent.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Generate or get secret hash
    let secretHash = employee.hash;
    if (!secretHash) {
      secretHash = await this.generateHash(identifier + this.env.HASH_SALT);
      employee.hash = secretHash;
      await employeeRepo.save(employee);
    }

    // Generate temporal hash
    const timestamp = Date.now();
    const temporalHash = await this.generateHash(secretHash + timestamp);

    // For development, return the link directly
    const isTestMode = request.headers.get("x-test-mode") === "true";
    const magicLink = `https://yourapp.pages.dev/?token=${temporalHash}&ts=${timestamp}`;

    if (isTestMode) {
      return new Response(
        JSON.stringify({
          message: "Magic link generated",
          magicLink,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Send email via SendGrid
    try {
      await this.sendMagicLinkEmail(identifier, magicLink);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send magic link" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        message: "If the email exists, a magic link has been sent.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  async handleValidateToken(
    request: Request,
    corsHeaders: Record<string, string>,
  ): Promise<Response> {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const ts = url.searchParams.get("ts");

    if (!token || !ts) {
      return new Response(
        JSON.stringify({ error: "Token and timestamp required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const timestamp = parseInt(ts);
    const now = Date.now();

    // Expire after 1 hour
    if (now - timestamp > 60 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find employee with matching temporal hash
    const employeeRepo = this.dataSource!.getRepository(Employee);
    const employees = await employeeRepo.find({
      where: { hash: Not(IsNull()) },
    });

    let validEmployee: Employee | null = null;
    for (const emp of employees) {
      const expectedTemporal = await this.generateHash(emp.hash! + timestamp);
      if (expectedTemporal === token) {
        validEmployee = emp;
        break;
      }
    }

    if (!validEmployee) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create session token
    const sessionTimestamp = Date.now();
    const signature = await this.generateHash(
      `${validEmployee.id}:${sessionTimestamp}:${this.env.HASH_SALT}`,
    );
    const sessionToken = `${validEmployee.id}.${sessionTimestamp}.${signature}`;

    return new Response(
      JSON.stringify({
        authToken: sessionToken,
        expiresAt: sessionTimestamp + 1 * 24 * 60 * 60 * 1000, // 1 day
        employee: {
          id: validEmployee.id,
          name: validEmployee.name,
          role: validEmployee.role,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  async handleHealth(corsHeaders: Record<string, string>): Promise<Response> {
    return new Response(
      JSON.stringify({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: "N/A (serverless)",
        version: "1.0.0-cloudflare",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  async handleLogout(corsHeaders: Record<string, string>): Promise<Response> {
    // In Workers, cookies are handled by the client
    // The client should clear the cookie
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleVersion(corsHeaders: Record<string, string>): Promise<Response> {
    return new Response(
      JSON.stringify({
        version: "1.0.0-cloudflare",
        fileAge: "N/A (serverless)",
        startTime: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  /**
   * Validates a session token and returns the associated employee
   */
  async validateSessionToken(token: string): Promise<Employee | null> {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const employeeId = Number(parts[0]);
      const timestamp = Number(parts[1]);
      const signature = parts[2];

      if (
        !Number.isFinite(employeeId) ||
        !Number.isFinite(timestamp) ||
        !signature
      ) {
        return null;
      }

      const expectedSignature = createHash("sha256")
        .update(
          `${employeeId}:${timestamp}:${this.env.HASH_SALT || "default_salt"}`,
        )
        .digest("hex");

      if (expectedSignature !== signature) {
        return null;
      }

      const now = Date.now();
      const sessionTtlMs = 1 * 24 * 60 * 60 * 1000;
      if (timestamp > now || now - timestamp > sessionTtlMs) {
        return null;
      }

      const employeeRepo = this.dataSource!.getRepository(Employee);
      return await employeeRepo.findOne({ where: { id: employeeId } });
    } catch (error) {
      console.error(`Error in validateSessionToken: ${error}`);
      throw error;
    }
  }

  /**
   * Authenticates a request and returns the employee
   */
  async authenticate(request: Request): Promise<Employee | null> {
    try {
      // Get auth token from Authorization header
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
      }

      const authToken = authHeader.substring(7); // Remove "Bearer " prefix

      // Validate session token
      const employee = await this.validateSessionToken(authToken);
      if (!employee) {
        console.log(`Authentication failed: Invalid session token`);
        return null;
      }

      return employee;
    } catch (error) {
      console.error(`Authentication error: ${error}`);
      return null;
    }
  }

  async handleGetPtoStatus(
    request: Request,
    corsHeaders: Record<string, string>,
  ): Promise<Response> {
    const employee = await this.authenticate(request);
    if (!employee) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ptoEntryRepo = this.dataSource!.getRepository(PtoEntry);
    const ptoEntries = await ptoEntryRepo.find({
      where: { employee_id: employee.id },
    });

    // Convert to PTO calculation format
    const ptoEntriesData = ptoEntries.map((entry) => ({
      id: entry.id,
      employee_id: entry.employee_id,
      date: entry.date,
      type: entry.type,
      hours: entry.hours,
      created_at: entry.created_at.toISOString(),
    }));

    // Convert employee to business rules format
    const employeeData = {
      id: employee.id,
      name: employee.name,
      identifier: employee.identifier,
      pto_rate: employee.pto_rate,
      carryover_hours: employee.carryover_hours,
      hire_date: employee.hire_date.toISOString().split("T")[0], // Convert Date to YYYY-MM-DD string
      role: employee.role,
    };

    const status = calculatePTOStatus(employeeData, ptoEntriesData);

    return new Response(JSON.stringify(status), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  async handleGetPtoEntries(
    request: Request,
    corsHeaders: Record<string, string>,
  ): Promise<Response> {
    // Authentication and authorization logic here
    const employeeId = 1; // From auth

    const ptoEntryRepo = this.dataSource!.getRepository(PtoEntry);
    const entries = await ptoEntryRepo.find({
      where: { employee_id: employeeId },
      order: { created_at: "DESC" },
    });

    return new Response(JSON.stringify({ entries }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Helper methods
  async generateHash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  async sendMagicLinkEmail(email: string, magicLink: string): Promise<void> {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email }],
            subject: "Your Magic Link - DWP Hours Tracker",
          },
        ],
        from: { email: this.env.FROM_EMAIL },
        content: [
          {
            type: "text/plain",
            value: `Click this link to sign in to DWP Hours Tracker: ${magicLink}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`SendGrid error: ${response.status} - ${errorText}`);
    }
  }

  async handleCreatePtoEntry(
    request: Request,
    corsHeaders: Record<string, string>,
  ): Promise<Response> {
    const employee = await this.authenticate(request);
    if (!employee) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await request.json().catch(() => ({}))) as {
      date?: string;
      type?: string;
      hours?: number;
    };

    // Validate required fields
    if (!body.date || !body.type || body.hours === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { date, type, hours } = body;

    // Validate date
    const dateError = validateDateString(date);
    if (dateError) {
      return new Response(JSON.stringify({ error: dateError.messageKey }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate weekday
    const weekdayError = validateWeekday(date);
    if (weekdayError) {
      return new Response(JSON.stringify({ error: weekdayError.messageKey }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate PTO type
    const typeError = validatePTOType(type);
    if (typeError) {
      return new Response(JSON.stringify({ error: typeError.messageKey }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate hours
    const hoursError = validateHours(hours);
    if (hoursError) {
      return new Response(JSON.stringify({ error: hoursError.messageKey }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for duplicate entry
    const ptoEntryRepo = this.dataSource!.getRepository(PtoEntry);
    const existingEntry = await ptoEntryRepo.findOne({
      where: { employee_id: employee.id, date, type: type as any },
    });
    if (existingEntry) {
      return new Response(JSON.stringify({ error: "Duplicate PTO entry" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create new entry
    const newEntry = ptoEntryRepo.create({
      employee_id: employee.id,
      date,
      type: type as "Sick" | "PTO" | "Bereavement" | "Jury Duty",
      hours,
    });
    await ptoEntryRepo.save(newEntry);

    // Save to R2
    await this.saveDatabaseToR2();

    return new Response(JSON.stringify({ success: true, entry: newEntry }), {
      status: 201,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Durable Object fetch handler
  async fetch(request: Request): Promise<Response> {
    return this.handleSession(request);
  }
}

// Worker entry point
interface WorkerEnv extends Env {
  DWP_HOURS_DO: DurableObjectNamespace;
}

export default {
  async fetch(
    request: Request,
    env: WorkerEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    // Route all requests to the Durable Object
    const id = env.DWP_HOURS_DO.idFromName("main");
    const stub = env.DWP_HOURS_DO.get(id);

    return stub.fetch(request);
  },
};
