/**
 * Display symbols and constants for calendar components
 */
export const CALENDAR_SYMBOLS = {
  HOURS_FULL: "●", // Full day (8+ hours)
  HOURS_PARTIAL: "½", // Partial day (< 8 hours)
  HOURS_CLEARING: "✕", // Clearing/removing entry
  CHECKMARK: "✓", // Approved entry indicator
  RECONCILED: "†", // Unapproved entry in locked month
  NOTE: "\u25BE", // ▾ — filled down-pointing triangle (note indicator)
  TYPE_DOT: "●", // PTO type indicator dot
  OVERUSE: "!", // Balance exceeded indicator
} as const;
