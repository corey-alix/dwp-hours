# deploy-azure.sh — Azure Deployment Script

## Purpose

Idempotent deployment script that:

1. Verifies Azure infrastructure exists (resource group, app service plan, web app) — creates any missing pieces
2. Configures runtime settings (Node version, startup command, app settings)
3. Assembles a deployment zip with `dist/server.mjs` (~7.5 MB bundle), `public/`, `db/schema.sql`, a minimal `package.json`, and `node_modules/` containing only `sql.js` (~19 MB)
4. Deploys via `az webapp deploy --type zip --clean true`
5. Waits 30 seconds and checks `/api/version` for a health response

Run with `pnpm az:deploy` or directly `./scripts/deploy-azure.sh`.

---

## Current Status: WORKING (2026-03-03)

The deployment pipeline is fully operational. The app starts successfully on Azure and responds to health checks at `/api/version`.

### Working Architecture

The production build bundles **all dependencies except `sql.js`** into a single `dist/server.mjs` file (~7.5 MB). This avoids all `node_modules` resolution issues on Azure. Only `sql.js` remains external because its WASM binary cannot be bundled.

```
deploy-azure/
├── dist/server.mjs          # esbuild bundle (~7.5 MB, includes express, typeorm, etc.)
├── dist/server.mjs.map      # source map
├── public/                   # static client assets
├── db/schema.sql             # database schema
├── start.sh                  # custom startup script (bypasses Oryx)
├── deploy-info.json
├── package.json              # { "type": "module", dependencies: { "sql.js": "..." } }
└── node_modules/             # only sql.js (~19 MB)
    └── sql.js/
```

---

## Issues Resolved (2026-03-03)

### Issue 1: Oryx node_modules Symlink + ESM Resolution

**Original error:** `ERR_MODULE_NOT_FOUND` — Azure's Oryx startup script relocates `node_modules/` to `/node_modules` and replaces the original with a symlink. Node's ESM resolver cannot follow symlinks correctly, causing all external package imports to fail.

**Fix:** Bundle all deps into `dist/server.mjs` (Solution #1 from original analysis). Only `sql.js` stays external because it loads a WASM binary. The custom `start.sh` startup script bypasses Oryx entirely.

### Issue 2: CJS Interop in ESM Bundle

**Error:** `Error: Dynamic require of "node:events" is not supported`

When esbuild bundles CJS libraries (Express, etc.) into an ESM output, bare `require()` calls fail because ESM doesn't provide `require`. Additionally, some bundled libraries (e.g., `app-root-path` via TypeORM) use `__dirname` and `__filename` which don't exist in ESM.

**Fix:** A banner in `build:server:prod` polyfills `require()`, `__filename`, and `__dirname`:

```bash
--banner:js="import{createRequire}from'module';import{fileURLToPath as __bfu}from'url';import{dirname as __bd}from'path';var require=createRequire(import.meta.url);var __filename=__bfu(import.meta.url);var __dirname=__bd(__filename);"
```

**Important:** The polyfills must use `var` (not `const` or `let`) because esbuild also generates its own `var __filename` / `var __dirname` shims deeper in the bundle. Using `const` would cause `SyntaxError: Identifier '__filename' has already been declared` since `const` + `var` redeclaration is illegal in JavaScript.

### Issue 3: TypeORM sqljs Driver Ignores `location` File When Bundled

**Error:** `QueryFailedError: no such table: employees`

TypeORM connects successfully but operates on an empty database. When TypeORM is bundled by esbuild, its internal `PlatformTools.readFileSync()` (used by `SqljsDriver` to load the database file from `location`) silently fails, causing TypeORM to fall back to a fresh empty in-memory database.

The server's own sql.js instance correctly creates the database, executes the schema, and writes it to disk — but TypeORM's bundled driver never reads that file.

**Fix:** Pass the database bytes directly to TypeORM via the `database` option, bypassing TypeORM's internal file loading:

```typescript
const data = db.export();
fs.writeFileSync(DB_PATH, Buffer.from(data));

dataSource = new DataSource({
  type: "sqljs",
  database: data, // Pass bytes directly — don't rely on TypeORM reading `location`
  location: DB_PATH, // Still needed for autoSave to know WHERE to write
  autoSave: true,
  // ...
});
```

### Issue 4: Container Startup Time

Azure's B1 SKU takes ~3 minutes to fully start the container. The deploy script's 30-second health check often returns "unreachable" even though the app is starting normally. This is cosmetic — the app will be available shortly after deployment completes.

---

## Historical: Oryx Symlink Problem (Resolved by Bundling)

This section is preserved for reference. The original problem no longer applies because we bundle all deps except sql.js.

### What Happens on Azure at Container Startup (Without Custom start.sh)

Even with `ENABLE_ORYX_BUILD=false`, Oryx's **startup script** detects `node_modules.tar.gz` and runs a relocation sequence:

```bash
# Oryx-generated /opt/startup/startup.sh (observed in docker logs):
cd "/home/site/wwwroot"
echo Found tar.gz based node_modules.
tar -xzf node_modules.tar.gz -C /node_modules
ln -sfn /node_modules ./node_modules   # symlink replaces real dir
node dist/server.mjs
```

Node's ESM resolver cannot follow the symlink correctly → `ERR_MODULE_NOT_FOUND`.

**Mitigation:** The custom `start.sh` script is set as the Azure startup file, which bypasses Oryx's relocation entirely. Combined with bundling all deps, `node_modules/` only contains `sql.js` (no ESM resolution issues).

---

## Real-Time Log Stream (Recommended for AI-Assisted Debugging)

The `scripts/az-log-stream.sh` script establishes a persistent log stream from the Azure container to a local file. This closes the deploy → observe → diagnose feedback loop without waiting for deployments to finish or downloading log zips after the fact.

### How It Works

1. The script runs `az webapp log tail` in the background, piping output to `./tmp/az-logs.txt` via `tee`
2. The agent (or human) reads the file with `tail` or `cat` to see real-time container startup output
3. After each `pnpm az:deploy`, new log entries appear within ~30–60 seconds as the container restarts

### Setup — Start the Log Stream

Start in a **background terminal** before deploying:

```bash
./scripts/az-log-stream.sh
# Or from VS Code agent: run as isBackground=true
```

The stream writes to `./tmp/az-logs.txt` (truncated on each script start).

### Agent Workflow — Deploy + Observe

The recommended agent workflow for iterative deployment debugging:

```text
1. Start log stream (background terminal, once per session)
     └─ ./scripts/az-log-stream.sh

2. Deploy
     └─ pnpm az:deploy

3. Wait ~60s for container restart, then read logs
     └─ tail -50 ./tmp/az-logs.txt
   OR └─ get_terminal_output on the background terminal ID

4. Diagnose errors from logs

5. Fix code → repeat from step 2
```

**Key advantage**: The agent gets immediate feedback from the container without:

- Waiting for the deploy script's 30s health check to timeout
- Downloading and parsing zip log archives
- Guessing whether the container has restarted yet

### Reading Logs from the Agent

After deploying, the agent can check logs in two ways:

**Option A** — Read the log file directly:

```bash
tail -50 ./tmp/az-logs.txt          # last 50 lines
grep -i "error\|fail\|start.sh" ./tmp/az-logs.txt  # filter for errors
```

**Option B** — Check the background terminal output:

```bash
# Use get_terminal_output with the terminal ID from the background run
```

### What to Look For in the Log Stream

| Log Pattern                                  | Meaning                                          |
| -------------------------------------------- | ------------------------------------------------ |
| `[start.sh] Starting server`                 | Our startup script is executing (good)           |
| `[start.sh] node_modules:`                   | Shows what's in node_modules on the container    |
| `Waiting for response to warmup request`     | Azure is waiting for the app to bind to PORT     |
| `Container ... didn't respond to HTTP pings` | App crashed or isn't listening on 8080           |
| `Error: Cannot find package`                 | Missing dependency — check build externals       |
| `Dynamic require of "..." is not supported`  | CJS interop issue — needs `createRequire` banner |
| `listening on port 8080`                     | App started successfully                         |

### Stopping the Log Stream

Kill the background terminal or press Ctrl+C in the terminal running the script. The log file persists at `./tmp/az-logs.txt` for post-mortem review.

---

## Debugging Cheat Sheet

### Download and inspect container logs (batch/offline)

Use this when the log stream isn't running, or to get historical logs:

```bash
rm -f ./tmp/logs.zip
az webapp log download --name dw-time --resource-group DWP_time_app_RG \
  --log-file ./tmp/logs.zip

# Application stdout/stderr (Node.js output):
python3 -c "
import zipfile
with zipfile.ZipFile('./tmp/logs.zip') as z:
    for name in sorted(z.namelist()):
        if 'default_docker' in name:
            print(z.read(name).decode()[-3000:])
"

# Container orchestration logs (pull/start/stop/timeout):
python3 -c "
import zipfile
with zipfile.ZipFile('./tmp/logs.zip') as z:
    for name in sorted(z.namelist()):
        if 'docker.log' in name and 'default' not in name:
            print(z.read(name).decode()[-3000:])
"
```

### Set a diagnostic startup command

```bash
az webapp config set --name dw-time --resource-group DWP_time_app_RG \
  --startup-file 'ls -la /home/site/wwwroot/ && ls -la /home/site/wwwroot/node_modules/ && node dist/server.mjs'
az webapp restart --name dw-time --resource-group DWP_time_app_RG
# Watch ./tmp/az-logs.txt for results (if stream is running), or download logs after ~120s
```

### Check current app settings

```bash
az webapp config appsettings list --name dw-time --resource-group DWP_time_app_RG -o table
az webapp config show --name dw-time --resource-group DWP_time_app_RG \
  --query "{linuxFxVersion: linuxFxVersion, startupFile: appCommandLine}" -o table
```

---

## Azure Infrastructure Reference

| Resource         | Value                                                           |
| ---------------- | --------------------------------------------------------------- |
| Subscription     | `4ee5218f-8732-4c27-87b0-2bbb0bf1179d`                          |
| Resource Group   | `DWP_time_app_RG`                                               |
| App Service Plan | `dw-pto-time-sp` (B1, Linux)                                    |
| Web App          | `dw-time`                                                       |
| Region           | `eastus2`                                                       |
| URL              | `https://dw-time-cpd5bsbtb9begja3.eastus2-01.azurewebsites.net` |
| Runtime          | `NODE\|24-lts` (Node v24.x)                                     |
| Startup Command  | `/home/site/wwwroot/start.sh` (custom script, bypasses Oryx)    |

## Key App Settings

| Setting                          | Value        | Purpose                                            |
| -------------------------------- | ------------ | -------------------------------------------------- |
| `NODE_ENV`                       | `production` | Standard Node env                                  |
| `PORT`                           | `8080`       | Azure Linux expects 8080 (server defaults to 3000) |
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `false`      | Prevent Kudu build step                            |
| `ENABLE_ORYX_BUILD`              | `false`      | Prevent Oryx build step                            |

---

## Applied Fixes Summary (2026-03-03)

The working deployment combines three fixes:

1. **Bundle all deps except sql.js** (`build:server:prod` uses `--external:sql.js` only, not `--packages=external`) — eliminates Oryx symlink issues entirely
2. **CJS-ESM banner** — polyfills `require()`, `__filename`, `__dirname` using `var` declarations for bundled CJS code
3. **Direct database handoff** — passes `database: data` (Uint8Array from `db.export()`) to TypeORM DataSource instead of relying on `location` file reading, which fails when TypeORM is bundled

### Key Files Modified

| File                                 | Change                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------- |
| `package.json` (`build:server:prod`) | Banner with CJS polyfills; `--external:sql.js` only                       |
| `server/server.mts` (`initDatabase`) | `db.export()` → `fs.writeFileSync` → `new DataSource({ database: data })` |
| `start.sh` (in deploy zip)           | Custom startup script bypassing Oryx                                      |
