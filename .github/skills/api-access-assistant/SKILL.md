# API Access Assistant

## Description

Specialized assistant for authenticating with and querying the DWP Hours Tracker REST API from the command line or scripts. Documents the authentication flow, common endpoints, and curl-based access patterns.

## Trigger

Activate when users need to:

- Query employee data from the running server
- Authenticate via the magic-link flow using curl
- Look up hours, PTO entries, or admin data via the API
- Debug API responses or test endpoints manually
- Script automated API interactions
- Seed the database with test data
- Import Excel spreadsheets into the system

## Authentication Flow

The API uses JWT-based authentication with a two-step magic-link flow. All protected endpoints require an `auth_hash` cookie containing a session JWT.

### Step 1: Request a Magic Link

```bash
curl -s -X POST http://localhost:$PORT/api/auth/request-link \
  -H "Content-Type: application/json" \
  -H "x-test-mode: true" \
  -d '{"identifier":"user@example.com"}'
```

**Notes:**

- The endpoint is `/api/auth/request-link` (not `/api/auth/magic-link`)
- The `x-test-mode: true` header causes the response to include the magic link directly (instead of emailing it)
- In non-production environments without SMTP configured, the magic link is also returned directly
- The response contains `{"message":"Magic link generated","magicLink":"http://localhost:$PORT/?token=<JWT>"}`

### Step 2: Validate the Token to Get a Session

Extract the token from the magic link URL and call the validate endpoint:

```bash
TOKEN=$(curl -s -X POST http://localhost:$PORT/api/auth/request-link \
  -H "Content-Type: application/json" \
  -H "x-test-mode: true" \
  -d '{"identifier":"user@example.com"}' \
  | grep -oP 'token=\K[^"]+')

SESSION=$(curl -s "http://localhost:$PORT/api/auth/validate?token=$TOKEN" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['authToken'])")
```

**Notes:**

- The validate endpoint is `GET /api/auth/validate?token=<JWT>`
- It returns `{"authToken":"<session-JWT>","expiresAt":...,"employee":{...}}`
- The `authToken` is a long-lived session JWT (10-year expiry)

### Step 3: Use the Session Token

Pass the session token as an `auth_hash` cookie on all subsequent requests:

```bash
curl -s "http://localhost:$PORT/api/hours?year=2018" \
  -H "Cookie: auth_hash=$SESSION"
```

### One-Liner Authentication Helper

Combine all steps for quick access:

```bash
# Authenticate as any user
PORT=3003
EMAIL="admin@example.com"
TOKEN=$(curl -s -X POST http://localhost:$PORT/api/auth/request-link \
  -H "Content-Type: application/json" -H "x-test-mode: true" \
  -d "{\"identifier\":\"$EMAIL\"}" | grep -oP 'token=\K[^"]+')
SESSION=$(curl -s "http://localhost:$PORT/api/auth/validate?token=$TOKEN" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['authToken'])")
```

## Common API Endpoints

### Public (No Auth Required)

| Method | Endpoint                 | Description                |
| ------ | ------------------------ | -------------------------- |
| GET    | `/api/health`            | Health check               |
| GET    | `/api/version`           | Server version             |
| POST   | `/api/auth/request-link` | Request magic link         |
| GET    | `/api/auth/validate`     | Exchange token for session |
| POST   | `/api/auth/logout`       | Clear session              |

### Employee (Auth Required)

| Method | Endpoint                     | Description                    |
| ------ | ---------------------------- | ------------------------------ |
| GET    | `/api/hours?year=YYYY`       | Get authenticated user's hours |
| POST   | `/api/hours`                 | Submit hours for a month       |
| GET    | `/api/auth/validate-session` | Validate current session       |

### Admin (Admin Auth Required)

| Method | Endpoint                                  | Description                                             |
| ------ | ----------------------------------------- | ------------------------------------------------------- |
| GET    | `/api/employees`                          | List all employees (sorted by name)                     |
| GET    | `/api/employees/:id`                      | Get a single employee by ID                             |
| GET    | `/api/admin/monthly-review/:month`        | Get all employees' data for a month (format: `YYYY-MM`) |
| GET    | `/api/admin/pto`                          | Get all employees' PTO entries                          |
| GET    | `/api/admin/report?year=YYYY`             | Generate annual report data                             |
| POST   | `/api/admin/import-excel`                 | Import data from Excel (multipart form, field: `file`)  |
| POST   | `/api/admin-acknowledgements`             | Submit admin acknowledgement                            |
| GET    | `/api/admin-acknowledgements/:employeeId` | Get admin acks for employee                             |

### Test-Only (Non-Production)

| Method | Endpoint                    | Description                  | Required Header       |
| ------ | --------------------------- | ---------------------------- | --------------------- |
| POST   | `/api/test/seed`            | Seed database with test data | `x-test-seed: true`   |
| POST   | `/api/test/reload-database` | Reload database from disk    | `x-test-reload: true` |

## Employee Listing

List all employees or look up a single employee by ID. Both endpoints require admin authentication.

### List All Employees

```bash
curl -s "http://localhost:$PORT/api/employees" \
  -H "Cookie: auth_hash=$ADMIN_SESSION" | python3 -m json.tool
```

### Get Single Employee by ID

```bash
curl -s "http://localhost:$PORT/api/employees/4" \
  -H "Cookie: auth_hash=$ADMIN_SESSION" | python3 -m json.tool
```

### List Response Pattern

Returns an array of employees sorted by name (camelCase fields):

```json
[
  {
    "id": 13,
    "name": "A Campbell",
    "identifier": "a-campbell@example.com",
    "ptoRate": 0.71,
    "carryoverHours": 43.53,
    "hireDate": "2015-08-19",
    "role": "Employee"
  }
]
```

### Single Employee Response Pattern

Returns a single employee object (snake_case fields):

```json
{
  "id": 4,
  "name": "a-bylenga@example.com",
  "identifier": "a-bylenga@example.com",
  "pto_rate": 0.74,
  "carryover_hours": 48.07,
  "hire_date": "2026-02-25",
  "role": "Employee"
}
```

**Note:** The list endpoint returns camelCase fields (serialized) while the single-employee endpoint returns snake_case fields (raw entity). Filter results with tools like `python3` or `jq`:

```bash
# Find a specific employee by name
curl -s "http://localhost:$PORT/api/employees" \
  -H "Cookie: auth_hash=$ADMIN_SESSION" \
  | python3 -c "
import sys,json
for emp in json.load(sys.stdin):
    if 'bylenga' in emp['name'].lower():
        json.dump(emp, sys.stdout, indent=2); print()
"
```

## Database Seeding

Two methods to seed the database with test data:

### Method 1: API Endpoint (Running Server)

Seed the in-memory database directly via the running server:

```bash
curl -s -X POST http://localhost:$PORT/api/test/seed \
  -H "x-test-seed: true" \
  -H "Content-Type: application/json"
```

**Notes:**

- Clears all tables (employees, pto_entries, monthly_hours, acknowledgements, admin_acknowledgements)
- Resets auto-increment counters
- Inserts seed employees and PTO entries from `shared/seedData.ts`
- Requires `x-test-seed: true` header or `NODE_ENV=test`/`NODE_ENV=development`

### Method 2: CLI Script (Offline)

Seed the database file on disk, then reload it into the running server:

```bash
# Step 1: Seed the database file
pnpm run seed

# Step 2: Reload the running server's database from disk
curl -s -X POST http://localhost:$PORT/api/test/reload-database \
  -H "x-test-reload: true" \
  -H "Content-Type: application/json"
```

Or use the combined convenience script:

```bash
pnpm run playwright:seed   # runs seed + server:reload
```

### Reload Database Endpoint

Reload the server's in-memory database from the on-disk file (useful after offline seeding or backup restore):

```bash
curl -s -X POST http://localhost:$PORT/api/test/reload-database \
  -H "x-test-reload: true" \
  -H "Content-Type: application/json"
```

## Excel Import

Import employee and PTO data from `.xlsx` spreadsheet files. Requires admin authentication.

### Import Command

```bash
curl -s -X POST http://localhost:$PORT/api/admin/import-excel \
  -H "Cookie: auth_hash=$ADMIN_SESSION" \
  -F "file=@path/to/spreadsheet.xlsx"
```

**Notes:**

- Uses multipart form upload (the `-F` flag, not `-d`)
- The form field name must be `file`
- Accepts only `.xlsx` files, max 10MB
- Files are temporarily stored in `/tmp` and cleaned up after processing
- Processes all sheets in the workbook — each sheet represents one employee
- Creates new employees if not found, updates existing ones
- Upserts PTO entries (creates or updates based on date/type match)

### Full Seed + Import Workflow

To get a clean database with real spreadsheet data:

```bash
PORT=3003

# Step 1: Seed the database with base test data
curl -s -X POST http://localhost:$PORT/api/test/seed \
  -H "x-test-seed: true" -H "Content-Type: application/json"

# Step 2: Authenticate as admin
TOKEN=$(curl -s -X POST http://localhost:$PORT/api/auth/request-link \
  -H "Content-Type: application/json" -H "x-test-mode: true" \
  -d '{"identifier":"admin@example.com"}' | grep -oP 'token=\K[^"]+')
ADMIN_SESSION=$(curl -s "http://localhost:$PORT/api/auth/validate?token=$TOKEN" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['authToken'])")

# Step 3: Import the Excel file
curl -s -X POST http://localhost:$PORT/api/admin/import-excel \
  -H "Cookie: auth_hash=$ADMIN_SESSION" \
  -F "file=@reports/2018.xlsx"
```

### Import Response Pattern

```json
{
  "message": "Import complete: 66 employees processed (65 created), 2396 PTO entries upserted, 0 acknowledgements synced.",
  "employeesProcessed": 66,
  "employeesCreated": 65,
  "ptoEntriesUpserted": 2396,
  "acknowledgementsSynced": 0,
  "warnings": [
    "PTO rate mismatch for \"A Bylenga\": spreadsheet=0.77, computed=0.74 ..."
  ],
  "perEmployee": [
    {
      "name": "A Bylenga",
      "employeeId": 12,
      "ptoEntries": 45,
      "acknowledgements": 0,
      "created": true
    }
  ]
}
```

### Available Spreadsheet Files

| File                | Description                                      |
| ------------------- | ------------------------------------------------ |
| `reports/2018.xlsx` | 2018 PTO data (~66 employees, ~2396 PTO entries) |

## Authentication Details

- **Cookie name**: `auth_hash`
- **Token type**: JWT (JSON Web Token)
- **Auth middleware**: `authenticate()` for employee endpoints, `authenticateAdmin()` for admin endpoints
- **Admin detection**: Based on `employee.role` field (must be `"Admin"`)
- **Auto-provisioning**: Unknown email addresses with allowed domains are auto-provisioned as new employees

## Response Patterns

### Monthly Review Response (`GET /api/admin/monthly-review/:month`)

```json
[
  {
    "employeeId": 4,
    "employeeName": "a-bylenga@example.com",
    "month": "2018-05",
    "totalHours": 0,
    "ptoHours": 0,
    "sickHours": 0,
    "bereavementHours": 0,
    "juryDutyHours": 0,
    "acknowledgedByAdmin": false,
    "calendarLocked": false,
    "notificationSent": false,
    "notificationReadAt": null
  }
]
```

### PTO Entries Response (`GET /api/admin/pto`)

Returns an array of all PTO entries across all employees (camelCase fields):

```json
[
  {
    "id": 403,
    "employeeId": 12,
    "date": "2018-07-27",
    "type": "PTO",
    "hours": 8,
    "createdAt": "2026-02-26T01:15:11.000Z",
    "approved_by": null,
    "notes": null
  }
]
```

**Notes:**

- The `notes` field contains import reconciliation reasoning or cell note text (often `null`)
- Filter by `employeeId` and `date` prefix to find entries for a specific employee and month
- The `type` field is one of: `"PTO"`, `"Sick"`, `"Bereavement"`, `"Jury Duty"`

### Hours Response (`GET /api/hours?year=YYYY`)

```json
{
  "employeeId": 4,
  "hours": [
    {
      "id": 1,
      "employee_id": 4,
      "month": "2018-05",
      "hours_worked": 160,
      "submitted_at": "2018-06-01"
    }
  ]
}
```

## Quick PTO Query Script

The `pnpm query:pto` command authenticates as admin and queries PTO entries from the running server. It uses the `$PORT` environment variable (default: 3003).

### Usage

```bash
# Query a specific employee + date
pnpm query:pto --employee "A Campbell" --date 2018-12-19

# Query by month
pnpm query:pto --employee campbell --month 2018-12

# Query by year
pnpm query:pto --employee campbell --year 2018
```

### How It Works

1. Authenticates as `admin@example.com` via the magic-link flow (request-link → validate → session token)
2. Fetches `/api/employees` to resolve the employee name substring to an ID
3. Fetches `/api/admin/pto` and filters by employee ID and date prefix
4. Displays matching entries with type, hours, and notes

### Script Location

[scripts/query-pto.mts](../../../scripts/query-pto.mts)

## Examples

- "How do I query the API for employee hours?"
- "Authenticate as admin and check May 2018 data"
- "What's the curl command to get PTO entries?"
- "How do I get a session token for API access?"
- "Query the monthly review for a specific employee"
- "Seed the database and import the 2018 spreadsheet"
- "How do I reset the database to a clean state?"
- "Import an Excel file into the running server"
- "Query A Campbell's PTO for December 19, 2018"

## Additional Context

- The server port defaults to 3003 in development; check `PORT` environment variable
- The `x-test-mode: true` header or `NODE_ENV=test` enables direct magic link return
- Employee identifiers are email addresses (e.g., `admin@example.com`)
- Month format for endpoints is `YYYY-MM` (e.g., `2018-05`)
- The `auth_hash` cookie is parsed manually in the auth middleware (no cookie-parser library)
- The `api/test/seed` endpoint requires `x-test-seed: true` header and clears all tables before inserting
- The `api/test/reload-database` endpoint requires `x-test-reload: true` header
- Excel import creates employees it doesn't find and merges PTO data by upserting on date/type
- The import response includes `warnings` for PTO rate mismatches, missing hire dates, and hours discrepancies
- Spreadsheet files are located in the `reports/` directory (outside the workspace gitignore in some worktrees)
