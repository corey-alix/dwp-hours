/**
 * Backup system configuration
 *
 * Backups are request-driven — no timers, no setInterval, no cron.
 * After each response is sent, the middleware checks whether
 * MIN_CHECK_INTERVAL_MS has elapsed since the last check.  If so it
 * evaluates the schedule to decide whether a new backup is needed and
 * cleans up old backups using a nearest-slot retention algorithm.
 *
 * The last-check timestamp is persisted to disk ("sticky state") so the
 * server remembers when work was last done even after a restart.
 */

const MINUTES = 1;
const HOURS = 60;
const DAYS = 24 * 60;

export const BACKUP_CONFIG = {
  /**
   * Minimum elapsed time (ms) between backup-check cycles.
   * This throttles how often the middleware evaluates the schedule.
   */
  MIN_CHECK_INTERVAL_MS: 1 * 1000, // 1 second

  /**
   * Backup schedule expressed in minutes-of-age.
   *
   * Each entry is a desired backup "age slot".  The system:
   *   • Creates a new backup when the newest existing backup is older
   *     than the smallest entry (1 minute).
   *   • Keeps the single backup whose age is closest to each slot.
   *   • Deletes everything that isn't the closest match to any slot.
   *
   * Sub-hour:  1m, 15m, 30m
   * Hours:     1h, 3h, 5h, 7h, 9h, 11h
   * Days 1–7:  daily
   * Day 14:    bridges daily → biweekly
   * Weeks 3–11: biweekly
   * Year 1:    ~quarterly (days 121, 241, 365)
   * Year 2:    ~quarterly (days 486, 606, 730)
   * Year 3:    ~quarterly (days 851, 971, 1095)
   *
   * Steady state: at most (entries + 1) backup files.
   */
  BACKUP_SCHEDULE_MINUTES: [
    // Sub-hour
    1 * MINUTES,
    15 * MINUTES,
    30 * MINUTES,
    // Hours
    1 * HOURS,
    3 * HOURS,
    5 * HOURS,
    7 * HOURS,
    9 * HOURS,
    11 * HOURS,
    // Daily (first week)
    1 * DAYS,
    2 * DAYS,
    3 * DAYS,
    4 * DAYS,
    5 * DAYS,
    6 * DAYS,
    7 * DAYS,
    // Biweekly bridge
    14 * DAYS,
    // Biweekly (weeks 3–11)
    21 * DAYS,
    35 * DAYS,
    49 * DAYS,
    63 * DAYS,
    77 * DAYS,
    // Quarterly — year 1
    121 * DAYS,
    241 * DAYS,
    365 * DAYS,
    // Quarterly — year 2
    486 * DAYS,
    606 * DAYS,
    730 * DAYS,
    // Quarterly — year 3
    851 * DAYS,
    971 * DAYS,
    1095 * DAYS,
  ] as readonly number[],

  // File naming
  FILENAME_PREFIX: "backup-",
  FILENAME_SUFFIX: ".db",

  /** Filename for the sticky last-check timestamp */
  LAST_CHECK_FILENAME: ".last-check",

  // Directories (relative to process.cwd())
  BACKUP_DIR: "db/backups",
  DB_PATH: "db/dwp-hours.db",
} as const;
