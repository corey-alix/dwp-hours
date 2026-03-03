---
name: azure-deployment-assistant
description: Specialized assistant for deploying the DWP Hours Tracker to Azure App Service and troubleshooting container startup failures.
---

# Azure Deployment Assistant

## Description

Guides deployment of the DWP Hours Tracker to Azure App Service (Linux, B1 SKU). Covers the full deploy pipeline (`pnpm az:deploy`), production build configuration, Oryx startup behavior, container log inspection, and iterative debugging of startup failures.

## Trigger

Activate this skill when:

- Deploying to Azure (`pnpm az:deploy`)
- Debugging Azure container startup failures
- Modifying the production build (`build:server:prod`)
- Changing server initialization code that affects deployment
- Adding new npm dependencies that may need bundling adjustments
- Investigating Oryx, Kudu, or Azure App Service behavior

## Azure Infrastructure

| Resource         | Value                                                           |
| ---------------- | --------------------------------------------------------------- |
| Resource Group   | `DWP_time_app_RG`                                               |
| App Service Plan | `dw-pto-time-sp` (B1, Linux)                                    |
| Web App          | `dw-time`                                                       |
| Region           | `eastus2`                                                       |
| Runtime          | `NODE\|24-lts`                                                  |
| URL              | `https://dw-time-cpd5bsbtb9begja3.eastus2-01.azurewebsites.net` |
| Startup Command  | `/home/site/wwwroot/start.sh` (custom script, bypasses Oryx)    |

## Response Pattern

### 1. Pre-Deploy Checklist

Before deploying, verify:

- `pnpm run build:server:prod` succeeds without errors
- The banner in `build:server:prod` includes CJS polyfills (`require`, `__filename`, `__dirname`) using `var` declarations
- `server/server.mts` passes `database: data` directly to the TypeORM `DataSource` constructor (not relying on `location` file reading)
- Any new npm dependency is either bundled by esbuild or explicitly listed in `--external:`
- The `start.sh` script exists in the deploy staging directory

### 2. Deploy

Run the idempotent deploy script:

```bash
pnpm az:deploy
```

This builds, assembles a zip, and deploys via `az webapp deploy --type zip --clean true`. The script waits 30 seconds for a health check, but **B1 containers take ~3 minutes to start** — an "unreachable" response at 30s is normal.

### 3. Verify Deployment

Wait ~3 minutes after deploy, then check:

```bash
curl -s https://dw-time-cpd5bsbtb9begja3.eastus2-01.azurewebsites.net/api/version
```

Expected response: `{"version":"1.0.0", ...}`

### 4. Troubleshoot Failures

If the health check fails after 3+ minutes, download container logs:

```bash
rm -f ./tmp/logs.zip
az webapp log download --name dw-time --resource-group DWP_time_app_RG \
  --log-file ./tmp/logs.zip

python3 << 'EOF'
import zipfile
with zipfile.ZipFile('./tmp/logs.zip') as z:
    docker_logs = [n for n in z.namelist() if 'default_docker' in n.lower()]
    docker_logs.sort()
    for name in docker_logs[-1:]:
        content = z.read(name).decode('utf-8', errors='replace')
        lines = content.split('\n')
        # Find last startup attempt
        last_start = -1
        for i, line in enumerate(lines):
            if '[start.sh]' in line:
                last_start = i
        if last_start >= 0:
            for line in lines[max(0, last_start-2):last_start+50]:
                print(line)
        else:
            for line in lines[-60:]:
                print(line)
EOF
```

### 5. Interpret Log Patterns

| Log Pattern                                         | Meaning                              | Action                                         |
| --------------------------------------------------- | ------------------------------------ | ---------------------------------------------- |
| `[start.sh] Starting server`                        | Custom startup script ran            | Good — Oryx bypassed                           |
| `[start.sh] node_modules: sql.js`                   | Only sql.js in node_modules          | Good — all else bundled                        |
| `Server successfully listening on port 8080`        | App started                          | Deployment succeeded                           |
| `Dynamic require of "..." is not supported`         | CJS code in ESM bundle               | Check `createRequire` banner                   |
| `__dirname is not defined in ES module scope`       | Missing `__dirname` polyfill         | Check banner has `var __dirname`               |
| `Identifier '__filename' has already been declared` | Banner uses `const` instead of `var` | Change banner to use `var`                     |
| `no such table: employees`                          | TypeORM got empty DB                 | Pass `database: data` to DataSource            |
| `Cannot find package`                               | Missing external dependency          | Bundle it or add to `--external:`              |
| `Container didn't respond to HTTP pings`            | App crashed or wrong port            | Check PORT=8080, inspect error above this line |

## Production Build Architecture

### What Gets Bundled

The `build:server:prod` script bundles **everything except sql.js** into one ESM file:

```bash
esbuild server/server.mts --bundle --outfile=dist/server.mjs \
  --format=esm --platform=node --external:sql.js --sourcemap \
  --banner:js="import{createRequire}from'module';...var require=createRequire(import.meta.url);var __filename=...;var __dirname=...;"
```

This means Express, TypeORM, cors, helmet, jsonwebtoken, exceljs, etc. are all inlined into `dist/server.mjs` (~7.5 MB). Only `sql.js` needs `node_modules/` at runtime (because of its WASM binary).

### Why Bundle Instead of External

Azure's Oryx startup script relocates `node_modules/` via symlinks. Node's ESM resolver cannot follow these symlinks correctly, causing `ERR_MODULE_NOT_FOUND` for any external package. Bundling eliminates this entirely.

### CJS-ESM Banner Requirements

The banner **must** use `var` (not `const` or `let`) for polyfills because esbuild also generates its own `var __filename` / `var __dirname` deeper in the bundle. JavaScript allows `var` + `var` redeclaration but not `const` + `var`.

### TypeORM Database Handoff

TypeORM's `SqljsDriver` uses internal `PlatformTools.readFileSync()` to load the database from `location`. When TypeORM is bundled by esbuild, this silently fails — TypeORM falls back to an empty in-memory database. The fix passes `database: data` (the `Uint8Array` from `db.export()`) directly:

```typescript
const data = db.export();
fs.writeFileSync(DB_PATH, Buffer.from(data));

dataSource = new DataSource({
  type: "sqljs",
  database: data, // Direct handoff — bypasses broken file loading
  location: DB_PATH, // Still needed for autoSave writes
  autoSave: true,
  // ...
});
```

## Real-Time Log Stream

For iterative debugging, use the log stream instead of downloading zips:

```bash
# Start in a background terminal (once per session)
./scripts/az-log-stream.sh

# After deploying, read logs
tail -50 ./tmp/az-logs.txt
grep -i "error\|fail\|start.sh" ./tmp/az-logs.txt
```

The recommended agent workflow:

1. Start log stream (background, once)
2. `pnpm az:deploy`
3. Wait ~60s, read `./tmp/az-logs.txt`
4. Diagnose → fix → repeat from step 2

## Common Pitfalls

### Adding a New Dependency

When adding a new npm dependency to the server:

1. **Default: it gets bundled** — esbuild inlines it into `dist/server.mjs`. No action needed unless it has native binaries or WASM.
2. **If it has native code or WASM** — add `--external:package-name` to `build:server:prod` and ensure the deploy script installs it in the staging `node_modules/`.
3. **If it uses `require()` internally** — the `createRequire` banner handles this. No action needed.
4. **If it uses `__dirname`/`__filename`** — the banner handles this. No action needed.

### Changing Server Initialization

If you modify `initDatabase()` in `server/server.mts`:

- Always persist the sql.js database to disk before TypeORM initialization
- Always pass `database: data` to the DataSource constructor
- Test locally with `pnpm run build:server:prod && node dist/server.mjs` to catch bundling issues before deploying

### Oryx Interference

Azure's Oryx startup script runs even with `ENABLE_ORYX_BUILD=false` and `SCM_DO_BUILD_DURING_DEPLOYMENT=false`. These settings only disable the _build_ step, not the startup script's `node_modules` relocation.

The custom `start.sh` (set as Azure's startup file) bypasses Oryx entirely. **Never change the startup command to a bare `node ...` command** — Oryx will wrap it in its own startup script.

## Diagnostic Commands

```bash
# Check current app settings
az webapp config appsettings list --name dw-time --resource-group DWP_time_app_RG -o table

# Check runtime and startup command
az webapp config show --name dw-time --resource-group DWP_time_app_RG \
  --query "{linuxFxVersion: linuxFxVersion, startupFile: appCommandLine}" -o table

# Set diagnostic startup (inspect filesystem before starting)
az webapp config set --name dw-time --resource-group DWP_time_app_RG \
  --startup-file 'ls -la /home/site/wwwroot/ && ls -la /home/site/wwwroot/node_modules/ && node dist/server.mjs'

# Restart without redeploying
az webapp restart --name dw-time --resource-group DWP_time_app_RG

# Download container logs
az webapp log download --name dw-time --resource-group DWP_time_app_RG --log-file ./tmp/logs.zip
```

## Key Files

| File                                    | Purpose                                                  |
| --------------------------------------- | -------------------------------------------------------- |
| `scripts/deploy-azure.sh`               | Idempotent deploy script (infra + build + zip + deploy)  |
| `scripts/deploy-azure.sh.md`            | Detailed deployment documentation and issue history      |
| `scripts/az-log-stream.sh`              | Real-time container log streaming to `./tmp/az-logs.txt` |
| `package.json` (`build:server:prod`)    | Production esbuild command with CJS banner               |
| `server/server.mts` (`initDatabase`)    | Database init with direct TypeORM handoff                |
| `start.sh` (generated by deploy script) | Custom startup script that bypasses Oryx                 |

## Examples

- "Deploy the app to Azure"
- "The Azure deployment is failing with a container timeout"
- "I added a new npm package and the Azure deploy is broken"
- "How do I check the Azure container logs?"
- "The app shows 'no such table' on Azure but works locally"
- "What's the Oryx startup script doing to node_modules?"

## Additional Context

- This skill complements `esbuild-configuration-assistant` (build config) and `low-memory-deployment` (resource constraints)
- The detailed issue history and root cause analysis is in `scripts/deploy-azure.sh.md`
- The B1 SKU has limited CPU — container cold starts take ~3 minutes
- The app uses sql.js (WASM SQLite) — the only dependency that cannot be bundled
- TypeORM is bundled but requires the `database` bytes handoff pattern
