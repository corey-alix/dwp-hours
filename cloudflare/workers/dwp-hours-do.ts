import { DurableObject } from "cloudflare:workers";
import initSqlJs from "sql.js";
import { DataSource, Not, IsNull } from "typeorm";
import { Employee } from "../../server/entities/Employee.js";
import { PtoEntry } from "../../server/entities/PtoEntry.js";
import { MonthlyHours } from "../../server/entities/MonthlyHours.js";
import { Acknowledgement } from "../../server/entities/Acknowledgement.js";
import { AdminAcknowledgement } from "../../server/entities/AdminAcknowledgement.js";

// SendGrid integration
const SENDGRID_API_KEY = "your-sendgrid-api-key"; // Set in environment
const FROM_EMAIL = "noreply@yourapp.com";

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
        // Load schema from file (you'd need to include this in the worker)
        const schemaResponse = await fetch(
          "https://your-deployment-url/schema.sql",
        );
        const schema = await schemaResponse.text();
        this.db.exec(schema);
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

  async handleLogout(corsHeaders: Record<string, string>): Promise<Response> {
    // In Workers, cookies are handled by the client
    // The client should clear the cookie
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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

  async handleGetPtoStatus(
    request: Request,
    corsHeaders: Record<string, string>,
  ): Promise<Response> {
    // Authentication check would go here
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const employeeId = 1; // Parse from auth token
    const ptoStatus = await this.calculatePtoStatus(employeeId);

    return new Response(JSON.stringify(ptoStatus), {
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

  async handleCreatePtoEntry(
    request: Request,
    corsHeaders: Record<string, string>,
  ): Promise<Response> {
    // Authentication and validation logic here
    const body = (await request.json().catch(() => ({}))) as {
      start_date?: string;
      hours?: number;
      type?: string;
    };

    if (!body.start_date || typeof body.hours !== "number" || !body.type) {
      return new Response(JSON.stringify({ error: "Invalid request data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { start_date, hours, type } = body;

    const employeeId = 1; // From auth

    const ptoEntryRepo = this.dataSource!.getRepository(PtoEntry);
    const newEntry = ptoEntryRepo.create({
      employee_id: employeeId,
      date: start_date, // Use the date field from entity
      type: type as "Sick" | "PTO" | "Bereavement" | "Jury Duty",
      hours,
    });

    await ptoEntryRepo.save(newEntry);

    return new Response(JSON.stringify({ entry: newEntry }), {
      status: 201,
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

  async calculatePtoStatus(employeeId: number): Promise<any> {
    // Implement PTO calculation logic here
    // This would replicate the current server logic
    return {
      employeeId,
      // ... PTO status data
    };
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
