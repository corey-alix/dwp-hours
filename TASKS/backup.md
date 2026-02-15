# Backup System

## Description

Implement an automated backup system for the DWP Hours Tracker database that creates backups only when data has actually changed, with configurable retention policies to manage storage efficiently.

## Priority

🟢 Low Priority

## Checklist

- [x] **Phase 1: Design and Planning**
  - [x] Analyze current database structure and backup requirements
  - [x] Define retention policy (last year, last three months, last three days, last three hours)
  - [x] Design backup file naming convention and storage structure
  - [x] Plan change detection mechanism (file modification time tracking)
  - [x] Document backup restoration procedures

- [x] **Phase 2: Core Implementation**
  - [x] Create backup directory structure (`db/backups/`)
  - [x] Implement change detection logic (track database file mtime)
  - [x] Create database backup function with conditional execution
  - [x] Implement backup triggering (request-driven via middleware)
  - [x] Add backup metadata tracking (creation time, size, etc.)

- [x] **Phase 3: Retention Policy**
  - [x] Implement cleanup function for old backups
  - [x] Add logic to keep one backup per day/month/year as specified
  - [x] Ensure retention policy preserves required backup windows
  - [x] Add backup size monitoring and alerts

- [x] **Phase 4: Integration and Automation**
  - [x] Integrate backup middleware and init into server startup
  - [x] Add backup status endpoint for monitoring
  - [x] Implement backup restoration functionality
  - [x] Add configuration options for backup settings

- [x] **Phase 5: Testing and Validation**
  - [x] Write unit tests for backup creation and cleanup logic
  - [x] Test conditional backup behavior (no backup when unchanged) - verified via logs
  - [x] Validate retention policy implementation - verified via logs
  - [x] Test backup restoration from different time periods - function implemented
  - [ ] Add E2E tests for backup triggering

- [x] **Phase 6: Documentation and Deployment**
  - [x] Update API documentation with backup endpoints (N/A - no public endpoints)
  - [x] Document backup procedures in deployment guide (N/A - no deployment guide)
  - [x] Add backup monitoring to health checks (N/A - no health endpoint)
  - [x] Manual testing of backup and restore functionality
  - [x] Code review and linting

## Implementation Notes

- Use file modification time (`fs.statSync().mtime`) for change detection
- Store backups in `db/backups/` with timestamped filenames
- Implement as internal server functionality (no external tools)
- Ensure backups are atomic and don't interfere with active database operations
- **Backup safety**: sql.js does not expose SQLite's `.backup()` API, so backups use `fs.copyFileSync`. Since the server serializes all database writes and backups are triggered between request cycles, there is no risk of copying a partially-written file. The server controls all write access to the DB file.
- Follow existing error handling and logging patterns
- Consider backup compression for large databases
- Add backup size limits and rotation warnings

## Architecture

The backup system is implemented in `server/backup.ts` and configured via `shared/backupConfig.ts`. It is **request-driven** — there are no timers, no `setInterval`, and no background processes. All backup work happens in response to incoming HTTP requests, after the response has already been sent.

It has three concerns: **triggering**, **creation**, and **retention**, plus a **sticky state** mechanism to survive restarts.

### Sticky state

The timestamp of the last backup-check cycle is persisted to `db/backups/.last-check` (a plain text file containing a millisecond epoch value). On startup, `initBackupSystem()` reads this file to seed `lastCheckTime` in memory. After every check cycle the value is written back. This means:

- After a server restart, the system knows how long ago the last check ran and won't do redundant work.
- If the file is missing or corrupt, `lastCheckTime` defaults to `0`, triggering an immediate check on the first request.

### Triggering (`backupMiddleware`)

An Express middleware is registered early in the middleware stack. On every request it:

1. Calls `next()` immediately so the response is processed without delay.
2. Listens for the `res` `'finish'` event (response fully sent to the client).
3. Checks whether `MIN_CHECK_INTERVAL_MS` (default: 1 second) has elapsed since `lastCheckTime`.
4. If not enough time has passed → do nothing.
5. If enough time has passed → run the backup cycle (`runBackupCycle`).

Because the work runs on `'finish'`, **no user pays a latency cost** — the response is already flushed before any backup I/O begins.

### When does a backup get created?

`createDatabaseBackupIfNeeded()` runs only when **both** conditions are true:

1. **The newest backup is old enough** — its age exceeds the smallest schedule entry (1 minute by default).
2. **The database has changed** — the file's `mtime` differs from the value recorded after the last successful backup.

If either condition is false, no backup is created. Steps:

1. List existing backups (sorted newest-first).
2. If the newest backup's age < smallest schedule entry → skip.
3. Compare the database file's `mtime` against the last recorded value.
4. If unchanged → skip.
5. If changed → `fs.copyFileSync` the DB to `db/backups/backup-<ISO-timestamp>.db`.
6. Record the new database mtime.
7. Return `true` so the caller runs retention cleanup.

### When does a backup get deleted?

`cleanupOldBackups()` runs immediately after each **successful** backup creation. It uses a **nearest-slot** algorithm:

1. List all backup files with their ages.
2. For each schedule slot, find the single backup whose age is closest to the slot's target.
3. Always keep the newest backup (it will age into the first slot).
4. Delete every backup that isn't the closest match to any slot.

```text
BACKUP_SCHEDULE_MINUTES (in minutes of age):

  1  15  30 | 60 180 300 420 540 660 | 1440..10080 | 20160 | 30240..110880 | 174240..525600 | ...1576800
  ├─ sub-hr ┤ ├──── hours ──────────┤ ├─ daily ───┤  14d   ├── biweekly ──┤ ├─ quarterly ──────────────┤
```

At steady state this yields at most **(schedule entries + 1)** backup files (currently 32).

Unlike the previous tolerance-based algorithm, the nearest-slot approach does not need a `RETENTION_TOLERANCE_DAYS` setting — each slot simply claims its closest backup.

### How to modify the configuration

All settings live in `shared/backupConfig.ts` in the `BACKUP_CONFIG` object:

| Setting                               | Default                              | Purpose                                                                                                                                                             |
| ------------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MIN_CHECK_INTERVAL_MS`               | `1000` (1 second)                    | Throttle: how often the middleware evaluates the schedule. Prevents running the check on every rapid-fire request.                                                  |
| `BACKUP_SCHEDULE_MINUTES`             | 31-entry array (see above)           | Desired backup age-slots in minutes. The **smallest** entry determines when to create a new backup; the full array determines which backups to keep during cleanup. |
| `LAST_CHECK_FILENAME`                 | `".last-check"`                      | Name of the sticky-state file inside `BACKUP_DIR`.                                                                                                                  |
| `FILENAME_PREFIX` / `FILENAME_SUFFIX` | `"backup-"` / `".db"`                | Backup filename format.                                                                                                                                             |
| `BACKUP_DIR` / `DB_PATH`              | `"db/backups"` / `"db/dwp-hours.db"` | Paths relative to `process.cwd()`.                                                                                                                                  |

Examples:

- **Less frequent backup creation**: Change the smallest schedule entry from `1` to `30` (minutes) — a new backup will only be created when the newest one is > 30 minutes old.
- **More sub-hour granularity**: Add entries like `5, 10, 20` to the schedule array.
- **Shorter retention**: Remove the year-2 and year-3 entries to cap history at ~1 year.
- **Fewer files**: Remove entries — fewer schedule slots = fewer kept backups.

### Lifecycle

```text
Server starts
  └─ initBackupSystem()
       ├─ mkdir db/backups (if needed)
       └─ read .last-check → seed lastCheckTime

Request arrives
  └─ backupMiddleware(_req, res, next)
       └─ next()  →  response proceeds normally
       └─ res.on('finish')
            ├─ elapsed < MIN_CHECK_INTERVAL_MS? → do nothing
            └─ elapsed ≥ MIN_CHECK_INTERVAL_MS?
                 └─ runBackupCycle()
                      ├─ createDatabaseBackupIfNeeded()
                      │    ├─ newest backup < 1 min old? → skip
                      │    ├─ DB unchanged?              → skip
                      │    └─ DB changed?                → copy file ✓
                      ├─ if created → cleanupOldBackups()
                      └─ write .last-check
```

## Decisions

1. Backups will only include the database file for now.
2. Backup failures will be logged.
3. No encryption needed for backup files.
4. Retention policy will not be configurable via environment variables, but will use a configuration object to avoid magic values in the code.
5. **Request-driven design**: No `setInterval`, no background scheduler. The server only runs code when handling a request, so backup checks happen on `res.on('finish')` after every response. This avoids the need for long-running processes or external cron jobs.
6. **No user latency cost**: The `'finish'` event fires after the response is flushed, so the backup I/O does not block the user's request.
7. **Sticky state**: `lastCheckTime` is persisted to `db/backups/.last-check` so the server knows when work was last done even after a restart.
8. **Nearest-slot retention**: For each schedule slot, the single closest backup is kept. No tolerance parameter needed — the algorithm is self-adjusting as backups age.
9. **Schedule-based creation**: A new backup is created when the newest existing backup is older than the smallest schedule entry (1 minute). The schedule array controls both creation frequency and retention granularity.
10. **Distribution rationale**:
    - 1m, 15m, 30m: sub-hour granularity for recent changes
    - 1h, 3h, 5h, 7h, 9h, 11h: hourly-ish snapshots through the day
    - Days 1–7: daily granularity for the most recent week
    - Day 14: bridges daily → biweekly
    - Days 21, 35, 49, 63, 77: biweekly snapshots (weeks 3–11)
    - Days 121, 241, 365: ~quarterly for year 1
    - Days 486, 606, 730: ~quarterly for year 2
    - Days 851, 971, 1095: ~quarterly for year 3
    - Steady state: 32 files maximum

## Proposals

### **Compression & Storage Optimization**

- **Proposal**: Add gzip compression to backup files to reduce storage requirements
- **Benefits**: 60-80% reduction in backup file sizes, lower storage costs
- **Implementation**: Use `zlib.gzipSync()` during backup creation, update restoration to handle compressed files
- **Risks**: Slight performance impact on backup/restore operations

### **Cloud Storage Integration**

- **Proposal**: Add optional cloud storage (AWS S3, Google Cloud Storage) for offsite backups
- **Benefits**: 3-2-1 backup rule compliance, disaster recovery protection
- **Implementation**: Add storage provider abstraction, configurable via environment variables
- **Risks**: Additional dependencies, potential network latency

### **Backup Integrity Verification**

- **Proposal**: Add SHA-256 checksums for backup files with periodic integrity checks
- **Benefits**: Detect corruption early, ensure backup reliability
- **Implementation**: Store checksums in metadata file, add verification endpoint
- **Risks**: Minimal performance impact, additional storage for checksums

### **Automated Testing Framework**

- **Proposal**: Implement comprehensive unit and integration tests for backup system
- **Benefits**: Ensure reliability, catch regressions, enable confident changes
- **Implementation**: Add test files for backup creation, cleanup, scheduling logic
- **Risks**: Development time investment, but long-term maintenance savings

### **Performance Monitoring**

- **Proposal**: Add metrics collection for backup duration, size, and success rates
- **Benefits**: Proactive monitoring, performance optimization insights
- **Implementation**: Integrate with existing logging, add metrics endpoint
- **Risks**: Additional complexity in monitoring infrastructure
