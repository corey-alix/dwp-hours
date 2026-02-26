/**
 * Query PTO entries from the running server for a specific employee and date.
 *
 * Usage:
 *   pnpm query:pto --employee <name> --date <YYYY-MM-DD>
 *   pnpm query:pto --employee <name> --month <YYYY-MM>
 *   pnpm query:pto --employee <name> --year <YYYY>
 *
 * Examples:
 *   pnpm query:pto --employee "A Campbell" --date 2018-12-19
 *   pnpm query:pto --employee campbell --month 2018-12
 *   pnpm query:pto --employee campbell --year 2018
 *
 * Environment:
 *   PORT  Server port (default: 3003)
 *
 * Authenticates as admin@example.com via the magic-link flow,
 * then queries /api/admin/pto and /api/employees to find matching entries.
 */

const PORT = process.env.PORT || "3003";
const BASE = `http://localhost:${PORT}`;
const ADMIN_EMAIL = "admin@example.com";

// ── Argument parsing ──

interface Args {
  employee: string;
  date?: string;
  month?: string;
  year?: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const map = new Map<string, string>();

  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--") && i + 1 < argv.length) {
      map.set(argv[i].slice(2), argv[i + 1]);
      i++;
    }
  }

  const employee = map.get("employee");
  if (!employee) {
    console.error(
      "Usage: pnpm query:pto --employee <name> [--date YYYY-MM-DD] [--month YYYY-MM] [--year YYYY]",
    );
    console.error("");
    console.error("Required:");
    console.error(
      '  --employee   Employee name or substring (e.g., "A Campbell" or "campbell")',
    );
    console.error("");
    console.error("Optional (at least one recommended):");
    console.error("  --date       Exact date (e.g., 2018-12-19)");
    console.error("  --month      Month prefix (e.g., 2018-12)");
    console.error("  --year       Year prefix (e.g., 2018)");
    process.exit(1);
  }

  return {
    employee,
    date: map.get("date"),
    month: map.get("month"),
    year: map.get("year"),
  };
}

// ── Authentication ──

async function authenticate(): Promise<string> {
  // Step 1: Request magic link
  const linkRes = await fetch(`${BASE}/api/auth/request-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-mode": "true",
    },
    body: JSON.stringify({ identifier: ADMIN_EMAIL }),
  });
  const linkData = (await linkRes.json()) as {
    magicLink?: string;
    message?: string;
  };
  const magicLink = linkData.magicLink;
  if (!magicLink) {
    console.error("Failed to get magic link:", linkData);
    process.exit(1);
  }

  // Step 2: Extract token and validate
  const token = new URL(magicLink).searchParams.get("token");
  if (!token) {
    console.error("No token in magic link:", magicLink);
    process.exit(1);
  }

  const validateRes = await fetch(
    `${BASE}/api/auth/validate?token=${token}`,
  );
  const validateData = (await validateRes.json()) as {
    authToken?: string;
  };
  if (!validateData.authToken) {
    console.error("Failed to validate token:", validateData);
    process.exit(1);
  }

  return validateData.authToken;
}

// ── API queries ──

interface Employee {
  id: number;
  name: string;
  identifier: string;
  ptoRate: number;
  carryoverHours: number;
  hireDate: string;
  role: string;
}

interface PtoEntry {
  id: number;
  employeeId: number;
  date: string;
  type: string;
  hours: number;
  createdAt: string;
  approved_by: string | null;
  notes: string | null;
}

async function fetchJson<T>(url: string, session: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Cookie: `auth_hash=${session}` },
  });
  return (await res.json()) as T;
}

// ── Main ──

async function main() {
  const args = parseArgs();
  const needle = args.employee.toLowerCase();

  console.log(`Authenticating as ${ADMIN_EMAIL} on port ${PORT}...`);
  const session = await authenticate();

  // Find matching employees
  const employees = await fetchJson<Employee[]>(
    `${BASE}/api/employees`,
    session,
  );
  const matches = employees.filter((e) =>
    e.name.toLowerCase().includes(needle),
  );

  if (matches.length === 0) {
    console.error(
      `No employee matching "${args.employee}" found among ${employees.length} employees.`,
    );
    process.exit(1);
  }

  console.log(
    `Found ${matches.length} matching employee(s): ${matches.map((e) => `${e.name} (id=${e.id})`).join(", ")}\n`,
  );

  // Fetch all PTO entries
  const allPto = await fetchJson<PtoEntry[]>(
    `${BASE}/api/admin/pto`,
    session,
  );

  const matchIds = new Set(matches.map((e) => e.id));

  // Filter by employee
  let filtered = allPto.filter((e) => matchIds.has(e.employeeId));

  // Filter by date/month/year
  const datePrefix = args.date || args.month || args.year;
  if (datePrefix) {
    filtered = filtered.filter((e) => e.date.startsWith(datePrefix));
  }

  // Display results
  if (filtered.length === 0) {
    console.log("No PTO entries found matching the criteria.");
    return;
  }

  // Group by employee
  for (const emp of matches) {
    const empEntries = filtered
      .filter((e) => e.employeeId === emp.id)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (empEntries.length === 0) continue;

    console.log(`=== ${emp.name} (id=${emp.id}) ===`);
    console.log(`  Hire date: ${emp.hireDate}`);
    console.log(`  PTO rate: ${emp.ptoRate}`);
    console.log(`  Carryover: ${emp.carryoverHours}h`);
    console.log(`  Entries: ${empEntries.length}\n`);

    const totalHours = empEntries.reduce((sum, e) => sum + e.hours, 0);

    for (const entry of empEntries) {
      const notesStr = entry.notes ? ` | notes: ${entry.notes}` : "";
      console.log(
        `  ${entry.date}  ${entry.type.padEnd(12)} ${String(entry.hours).padStart(4)}h${notesStr}`,
      );
    }
    console.log(`\n  Total: ${totalHours}h across ${empEntries.length} entries`);
    console.log();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
