import { BUSINESS_RULES_CONSTANTS } from "../../shared/businessRules.js";
import type { StorageService } from "./storage.js";
import { LocalStorageAdapter } from "./storage.js";

const STORAGE_KEY = "dwp-hours:lastActivityTimestamp";

/** Default adapter used when callers omit the storage parameter. */
const defaultStorage: StorageService = new LocalStorageAdapter();

/**
 * Checks whether the current visit qualifies as a new session.
 * A new session is detected when 8+ hours have elapsed since the
 * last recorded activity timestamp (or no timestamp exists).
 *
 * @param storage  Optional `StorageService` — defaults to `LocalStorageAdapter`.
 *                 Pass `InMemoryStorage` in tests to avoid global mocking.
 */
export function isFirstSessionVisit(
  storage: StorageService = defaultStorage,
): boolean {
  const stored = storage.getItem(STORAGE_KEY);
  if (!stored) return true;

  const lastActivity = new Date(stored).getTime();
  if (isNaN(lastActivity)) return true;

  const elapsed = Date.now() - lastActivity;
  return elapsed >= BUSINESS_RULES_CONSTANTS.SESSION_INACTIVITY_THRESHOLD_MS;
}

/**
 * Updates the activity timestamp to the current time.
 * Call after the session-start check (regardless of result)
 * to keep the rolling window accurate.
 *
 * @param storage  Optional `StorageService` — defaults to `LocalStorageAdapter`.
 *                 Pass `InMemoryStorage` in tests to avoid global mocking.
 */
export function updateActivityTimestamp(
  storage: StorageService = defaultStorage,
): void {
  storage.setItem(STORAGE_KEY, new Date().toISOString());
}
