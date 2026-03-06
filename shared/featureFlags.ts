/**
 * Feature Flags Module
 *
 * Reads feature flags from environment variables at runtime.
 * Falls back to the canonical default values in `businessRules.ts`
 * when an env var is not set.
 *
 * **Server-side**: import `featureFlags` and access properties directly.
 * **Client-side**: fetch resolved flags from `GET /api/config/flags`
 *   (the browser has no access to `process.env`).
 *
 * Env var naming convention: `FF_<FLAG_NAME>` (e.g. `FF_ENABLE_BROWSER_IMPORT`).
 */

import {
  ENABLE_BROWSER_IMPORT as DEFAULT_ENABLE_BROWSER_IMPORT,
  ENABLE_IMPORT_AUTO_APPROVE as DEFAULT_ENABLE_IMPORT_AUTO_APPROVE,
  AZURE_AD_ENABLED as DEFAULT_AZURE_AD_ENABLED,
} from "./businessRules.js";

// ── Helpers ──

/**
 * Coerces a string env-var value to a boolean.
 * - `"true"` / `"1"` → `true`
 * - `"false"` / `"0"` → `false`
 * - `undefined` / anything else → `defaultValue`
 */
export function envBool(
  envValue: string | undefined,
  defaultValue: boolean,
): boolean {
  if (envValue === undefined || envValue === "") return defaultValue;
  const lower = envValue.trim().toLowerCase();
  if (lower === "true" || lower === "1") return true;
  if (lower === "false" || lower === "0") return false;
  return defaultValue;
}

// ── Resolved flags (evaluated once at module load) ──

/** Resolved feature flag values for the current environment. */
export interface FeatureFlags {
  /** See `ENABLE_BROWSER_IMPORT` in `businessRules.ts`. */
  enableBrowserImport: boolean;
  /** See `ENABLE_IMPORT_AUTO_APPROVE` in `businessRules.ts`. */
  enableImportAutoApprove: boolean;
  /** See `AZURE_AD_ENABLED` in `businessRules.ts`. */
  azureAdEnabled: boolean;
}

/**
 * The resolved feature flags object.
 *
 * On the server this reads `process.env` at module-load time and falls
 * back to the defaults exported from `businessRules.ts`. In the browser
 * context where `process` is undefined the defaults are used directly.
 */
export function resolveFeatureFlags(
  env: Record<string, string | undefined> = typeof process !== "undefined" &&
  process.env
    ? process.env
    : {},
): FeatureFlags {
  return {
    enableBrowserImport: envBool(
      env.FF_ENABLE_BROWSER_IMPORT,
      DEFAULT_ENABLE_BROWSER_IMPORT,
    ),
    enableImportAutoApprove: envBool(
      env.FF_ENABLE_IMPORT_AUTO_APPROVE,
      DEFAULT_ENABLE_IMPORT_AUTO_APPROVE,
    ),
    azureAdEnabled: envBool(env.AZURE_AD_ENABLED, DEFAULT_AZURE_AD_ENABLED),
  };
}

/** Singleton resolved at module load (server startup / page load). */
export const featureFlags: FeatureFlags = resolveFeatureFlags();
