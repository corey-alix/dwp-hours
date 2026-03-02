# Feature Flags Refactor

## Description

Replace hardcoded feature toggles like ENABLE_BROWSER_IMPORT with environment-variable-driven configuration. Feature flags will be read from environment variables at runtime; if an environment variable is not set, the existing default value in `shared/businessRules.ts` is used as the fallback. This keeps the current behaviour unchanged out of the box while allowing per-environment overrides without code changes.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Analysis and Design

- [x] Identify all hardcoded feature flags in the codebase
- [x] Document ENABLE_BROWSER_IMPORT and other toggle usage
- [x] Analyze feature flag requirements and environments
- [x] Design environment-variable-based configuration (env var names, parsing, boolean coercion)
- [x] Document fallback strategy: env var → `businessRules.ts` default value
- [ ] Update architecture-guidance skill with feature flag patterns
- [x] Manual review of feature flag strategy

**Discovery Findings:**

- **Hardcoded feature flags identified:**
  - `ENABLE_BROWSER_IMPORT = true` in `shared/businessRules.ts`
  - `ENABLE_IMPORT_AUTO_APPROVE = true` in `shared/businessRules.ts`

- **Usage patterns:**
  - `ENABLE_BROWSER_IMPORT`: Used in `admin-settings-page/index.ts` (lines 38, 89) to conditionally show UI and change import behavior
  - `ENABLE_IMPORT_AUTO_APPROVE`: Used in server-side import logic (referenced in tasks but not directly found in current search)
  - Both flags are simple boolean constants, not configurable at runtime

- **Current issues:**
  - No runtime configuration - flags are compile-time constants
  - No environment-specific settings
  - No gradual rollout capabilities
  - Dead code paths remain in bundles when flags are false
  - No admin interface for toggling features

- **Impact:** 2 hardcoded flags controlling import features, used in 1+ components, no runtime configurability

### Phase 2: Configuration Infrastructure

- [x] Create `shared/featureFlags.ts` module that reads `process.env` for each flag and falls back to `businessRules.ts` defaults
- [x] Define env var naming convention (e.g. `FF_ENABLE_BROWSER_IMPORT`, `FF_ENABLE_IMPORT_AUTO_APPROVE`)
- [x] Implement boolean coercion (`"true"/"1"` → true, `"false"/"0"` → false, missing → default)
- [x] Add `.env.example` documenting all supported feature-flag env vars and their defaults
- [x] Test configuration loading and fallback behavior
- [x] Build passes, lint passes

### Phase 3: Feature Flag Migration

- [x] Replace direct imports of `ENABLE_BROWSER_IMPORT` with `featureFlags.enableBrowserImport`
- [x] Replace direct imports of `ENABLE_IMPORT_AUTO_APPROVE` with `featureFlags.enableImportAutoApprove`
- [x] Keep `businessRules.ts` constants as the canonical default values (single source of truth)
- [x] Add env var overrides to deployment config (`ecosystem.config.json`, `.env`)
- [x] Test flag-dependent code paths with and without env vars set
- [ ] Manual testing of feature toggles

### Phase 4: Client-Side Flag Delivery

- [x] Expose resolved feature flags via a server API endpoint (e.g. `GET /api/config/flags`)
- [x] Client reads flags at startup and caches them (no direct `process.env` access in browser code)
- [x] Ensure client-side defaults match `businessRules.ts` for offline/fallback scenarios
- [x] Test client flag loading and fallback behavior
- [x] Build passes, lint passes

### Phase 5: Testing and Validation

- [x] Update unit tests to work with configurable features
- [ ] Add E2E tests for feature flag scenarios
- [x] Test configuration loading in different environments
- [x] Performance testing for flag evaluation overhead
- [ ] Code review and configuration audit
- [ ] Documentation updates
- [x] Build passes, lint passes, all tests pass

## Implementation Notes

- **Environment Variables**: All feature flags are read from environment variables at runtime (server-side via `process.env`, client-side via an API endpoint)
- **Defaults in businessRules.ts**: The existing constants (`ENABLE_BROWSER_IMPORT`, `ENABLE_IMPORT_AUTO_APPROVE`) remain as the canonical default values; the env var layer only overrides when explicitly set
- **Env Var Naming**: `FF_<FLAG_NAME>` convention (e.g. `FF_ENABLE_BROWSER_IMPORT=false`)
- **Boolean Coercion**: `"true"` / `"1"` → `true`; `"false"` / `"0"` → `false`; missing → `businessRules.ts` default
- **Type Safety**: `shared/featureFlags.ts` exports a typed object so consumers get autocomplete and compile-time checks
- **Performance**: Flags are resolved once at startup (server) or once on page load (client) — negligible overhead
- **Deployment**: Override via `ecosystem.config.json` env block or `.env` file; no code changes needed per environment

## Questions and Concerns

1. How to handle feature flags that require server-side coordination? → Server reads env vars; client fetches resolved values from `GET /api/config/flags`
2. Should we implement A/B testing capabilities or just simple toggles? → NO, simple toggles only
3. How to manage configuration in production deployments? → Set env vars in `ecosystem.config.json` or `.env` on the droplet
4. What migration strategy for existing hardcoded flags? → Keep `businessRules.ts` defaults intact; add env var override layer; migrate consumers to `featureFlags.ts`
5. How to test all combinations of feature flags efficiently? → Vitest `beforeEach` sets `process.env` values; teardown restores originals</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/jupiter/TASKS/feature-flags-refactor.md
