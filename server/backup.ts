import fs from "fs";
import path from "path";
import type { Request, Response, NextFunction } from "express";
import { BACKUP_CONFIG } from "../shared/backupConfig.js";
import { logger } from "../shared/logger.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_MINUTE = 60 * 1000;

/** Resolved absolute paths derived from BACKUP_CONFIG and process.cwd() */
function resolvePaths() {
  return {
    dbPath: path.join(process.cwd(), BACKUP_CONFIG.DB_PATH),
    backupDir: path.join(process.cwd(), BACKUP_CONFIG.BACKUP_DIR),
  };
}

// ---------------------------------------------------------------------------
// Sticky state — persisted last-check timestamp
// ---------------------------------------------------------------------------

let lastCheckTime = 0;

function lastCheckFilePath(): string {
  const { backupDir } = resolvePaths();
  return path.join(backupDir, BACKUP_CONFIG.LAST_CHECK_FILENAME);
}

function readLastCheckTime(): number {
  try {
    const content = fs.readFileSync(lastCheckFilePath(), "utf-8").trim();
    const value = Number(content);
    return Number.isFinite(value) ? value : 0;
  } catch {
    return 0;
  }
}

function writeLastCheckTime(timestamp: number): void {
  try {
    fs.writeFileSync(lastCheckFilePath(), String(timestamp), "utf-8");
  } catch (error) {
    logger.error(`Failed to persist last-check timestamp: ${error}`);
  }
}

// ---------------------------------------------------------------------------
// Change detection
// ---------------------------------------------------------------------------

let lastBackupMtime: number | null = null;

/**
 * Returns true if the database file has been modified since the last
 * successful backup (tracked via mtime). Does NOT update the tracked
 * value — call `recordDatabaseMtime` after a successful copy.
 */
function hasDatabaseChanged(dbPath: string): boolean {
  const currentMtime = fs.statSync(dbPath).mtime.getTime();
  return lastBackupMtime === null || currentMtime !== lastBackupMtime;
}

/** Record the current database mtime after a successful backup. */
function recordDatabaseMtime(dbPath: string): void {
  lastBackupMtime = fs.statSync(dbPath).mtime.getTime();
}

// ---------------------------------------------------------------------------
// Backup creation
// ---------------------------------------------------------------------------

/**
 * Returns the smallest schedule entry converted to milliseconds.
 * A new backup is created when the newest existing backup is older than this.
 */
function smallestScheduleMs(): number {
  return Math.min(...BACKUP_CONFIG.BACKUP_SCHEDULE_MINUTES) * MS_PER_MINUTE;
}

/**
 * Creates a timestamped copy of the database file if:
 * 1. The newest backup is older than the smallest schedule entry, AND
 * 2. The database has actually changed since the last backup.
 *
 * Returns true if a backup was created.
 *
 * Safe with sql.js because the server serialises all database writes and
 * the backup runs after the response cycle completes.
 */
export function createDatabaseBackupIfNeeded(): boolean {
  const { dbPath, backupDir } = resolvePaths();

  try {
    // Check schedule: is the newest backup old enough to warrant a new one?
    const backups = listBackups();
    if (backups.length > 0) {
      const newestAgeMs = backups[0].ageDays * MS_PER_DAY;
      if (newestAgeMs < smallestScheduleMs()) {
        return false;
      }
    }

    // Check change: has the database actually been modified?
    if (!hasDatabaseChanged(dbPath)) {
      return false;
    }

    fs.mkdirSync(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(
      backupDir,
      `${BACKUP_CONFIG.FILENAME_PREFIX}${timestamp}${BACKUP_CONFIG.FILENAME_SUFFIX}`,
    );

    fs.copyFileSync(dbPath, backupPath);
    recordDatabaseMtime(dbPath);
    logger.info(`Backup created: ${backupPath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to create database backup: ${error}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Retention cleanup
// ---------------------------------------------------------------------------

/**
 * Determines which backups to keep based on the schedule.
 *
 * For each schedule slot the backup whose age is closest to that slot's
 * target age (in minutes) is kept.  The newest backup is always kept
 * regardless of schedule so it can age into the first slot.
 */
function getBackupsToKeep(backups: BackupFileInfo[]): Set<string> {
  const keep = new Set<string>();
  if (backups.length === 0) return keep;

  // Always keep the newest backup.
  keep.add(backups[0].filename);

  for (const slotMinutes of BACKUP_CONFIG.BACKUP_SCHEDULE_MINUTES) {
    const slotDays = slotMinutes / (24 * 60);
    let closest: BackupFileInfo | null = null;
    let closestDist = Infinity;

    for (const backup of backups) {
      const dist = Math.abs(backup.ageDays - slotDays);
      if (dist < closestDist) {
        closestDist = dist;
        closest = backup;
      }
    }

    if (closest) {
      keep.add(closest.filename);
    }
  }

  return keep;
}

/**
 * Deletes backup files that are not the closest match to any schedule slot.
 */
export function cleanupOldBackups(): void {
  const { backupDir } = resolvePaths();

  try {
    const backups = listBackups();
    const keep = getBackupsToKeep(backups);

    for (const backup of backups) {
      if (!keep.has(backup.filename)) {
        fs.unlinkSync(path.join(backupDir, backup.filename));
        logger.info(`Deleted old backup: ${backup.filename}`);
      }
    }
  } catch (error) {
    logger.error(`Failed to cleanup old backups: ${error}`);
  }
}

// ---------------------------------------------------------------------------
// Request-driven backup middleware
// ---------------------------------------------------------------------------

/**
 * Runs one backup cycle: create a backup if the schedule calls for one,
 * clean up old backups if a new one was created, and persist the
 * last-check timestamp.
 */
function runBackupCycle(): void {
  const created = createDatabaseBackupIfNeeded();
  if (created) {
    cleanupOldBackups();
  }

  const now = Date.now();
  lastCheckTime = now;
  writeLastCheckTime(now);
}

/**
 * Express middleware that runs the backup cycle **after** the response has
 * been sent (`res.on('finish')`), so no user pays a latency cost.
 *
 * On each request:
 * 1. Call `next()` immediately to let the response proceed.
 * 2. After the response is flushed, check whether `MIN_CHECK_INTERVAL_MS`
 *    has elapsed since the last check.
 * 3. If yes, run the backup cycle (schedule evaluation → optional
 *    creation → optional cleanup → persist timestamp).
 */
export function backupMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  next();

  res.on("finish", () => {
    const now = Date.now();
    if (now - lastCheckTime < BACKUP_CONFIG.MIN_CHECK_INTERVAL_MS) {
      return;
    }
    runBackupCycle();
  });
}

/**
 * One-time setup: ensure the backup directory exists and restore the
 * sticky last-check timestamp from disk.
 */
export function initBackupSystem(): void {
  const { backupDir } = resolvePaths();
  fs.mkdirSync(backupDir, { recursive: true });
  lastCheckTime = readLastCheckTime();
  logger.info("Backup system initialised (request-driven)");
}

// ---------------------------------------------------------------------------
// Status query (used by the /api/backup/status endpoint)
// ---------------------------------------------------------------------------

export interface BackupFileInfo {
  filename: string;
  size: number;
  created: string;
  ageDays: number;
}

/**
 * Returns metadata about all backup files, sorted newest-first.
 */
export function listBackups(): BackupFileInfo[] {
  const { backupDir } = resolvePaths();

  return fs
    .readdirSync(backupDir)
    .filter(
      (file) =>
        file.startsWith(BACKUP_CONFIG.FILENAME_PREFIX) &&
        file.endsWith(BACKUP_CONFIG.FILENAME_SUFFIX),
    )
    .map((file) => {
      const stats = fs.statSync(path.join(backupDir, file));
      return {
        filename: file,
        size: stats.size,
        created: stats.mtime.toISOString(),
        ageDays: (Date.now() - stats.mtime.getTime()) / MS_PER_DAY,
      };
    })
    .sort((a, b) => b.filename.localeCompare(a.filename));
}

/**
 * Returns full backup system status including config and database info.
 */
export function getBackupStatus() {
  const { dbPath, backupDir } = resolvePaths();
  const backups = listBackups();
  const dbStats = fs.existsSync(dbPath) ? fs.statSync(dbPath) : null;

  return {
    backupDirectory: backupDir,
    totalBackups: backups.length,
    lastBackup: backups.length > 0 ? backups[0] : null,
    databaseLastModified: dbStats ? dbStats.mtime.toISOString() : null,
    backups,
    config: {
      minCheckIntervalMs: BACKUP_CONFIG.MIN_CHECK_INTERVAL_MS,
      backupScheduleMinutes: BACKUP_CONFIG.BACKUP_SCHEDULE_MINUTES,
    },
  };
}

// ---------------------------------------------------------------------------
// Restore
// ---------------------------------------------------------------------------

/**
 * Validates that `filename` is a legitimate backup file and returns its
 * absolute path. Throws on invalid input.
 */
export function validateBackupFilename(filename: string): string {
  if (!filename) {
    throw new Error("Filename is required");
  }

  if (
    !filename.startsWith(BACKUP_CONFIG.FILENAME_PREFIX) ||
    !filename.endsWith(BACKUP_CONFIG.FILENAME_SUFFIX)
  ) {
    throw new Error("Invalid backup filename format");
  }

  const { backupDir } = resolvePaths();
  const backupPath = path.join(backupDir, filename);

  if (!fs.existsSync(backupPath)) {
    throw new Error("Backup file not found");
  }

  return backupPath;
}

/**
 * Restores the database from a backup file. Creates a pre-restore snapshot
 * first. Returns the pre-restore backup filename for reference.
 *
 * The caller is responsible for destroying and re-initialising the DataSource
 * around this call.
 */
export function restoreFromBackup(backupPath: string): string {
  const { dbPath, backupDir } = resolvePaths();

  const preRestoreName = `prerestore-${Date.now()}.db`;
  const preRestorePath = path.join(backupDir, preRestoreName);

  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, preRestorePath);
    logger.info(`Pre-restore backup created: ${preRestorePath}`);
  }

  fs.copyFileSync(backupPath, dbPath);
  logger.info(`Database restored from: ${backupPath}`);

  return preRestoreName;
}
