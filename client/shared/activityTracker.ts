import { BUSINESS_RULES_CONSTANTS } from "../../shared/businessRules.js";

const STORAGE_KEY = "dwp-hours:lastActivityTimestamp";

/**
 * Checks whether the current visit qualifies as a new session.
 * A new session is detected when 8+ hours have elapsed since the
 * last recorded activity timestamp (or no timestamp exists).
 */
export function isFirstSessionVisit(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return true;

    const lastActivity = new Date(stored).getTime();
    if (isNaN(lastActivity)) return true;

    const elapsed = Date.now() - lastActivity;
    return elapsed >= BUSINESS_RULES_CONSTANTS.SESSION_INACTIVITY_THRESHOLD_MS;
  } catch {
    // localStorage unavailable — treat as new session
    return true;
  }
}

/**
 * Updates the activity timestamp to the current time.
 * Call after the session-start check (regardless of result)
 * to keep the rolling window accurate.
 */
export function updateActivityTimestamp(): void {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    // localStorage unavailable — silent fallback
  }
}
