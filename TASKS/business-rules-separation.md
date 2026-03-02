# Business Rules Separation

## Description

Separate UI messages (VALIDATION_MESSAGES) from core business logic in shared/businessRules.ts. Extract messages to a localization layer and keep rules pure functions. Decouple domain logic from presentation concerns.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Analysis and Design

- [x] Analyze current businessRules.ts structure and dependencies
- [x] Document all UI messages embedded in business logic
- [x] Identify pure functions vs presentation-coupled code
- [x] Design localization layer for UI messages
- [x] Create separation patterns for domain vs presentation logic
- [x] Update architecture-guidance skill with separation patterns
- [ ] Manual review of separation strategy

**Localization Layer Design:**

The localization layer extracts all UI strings into a dedicated module (`shared/messages.ts`) and provides a typed resolution function. The design prioritizes message extraction for immediate decoupling while leaving the door open for full i18n later.

**New module: `shared/messages.ts`**

```typescript
// ── Message Catalogs ──
// All 4 constant objects move here from businessRules.ts:
export const VALIDATION_MESSAGES = { ... } as const;
export const SUCCESS_MESSAGES = { ... } as const;
export const NOTIFICATION_MESSAGES = { ... } as const;
export const UI_ERROR_MESSAGES = { ... } as const;

// ── Types ──
export type MessageKey = keyof typeof VALIDATION_MESSAGES;
export type SuccessMessageKey = keyof typeof SUCCESS_MESSAGES;
export type NotificationMessageKey = keyof typeof NOTIFICATION_MESSAGES;
export type UIErrorMessageKey = keyof typeof UI_ERROR_MESSAGES;

// ── Resolution ──
/**
 * Resolves a message key to a formatted UI string.
 * Substitutes `{placeholder}` tokens with values from `params`.
 * Returns the raw key as fallback if not found (aids debugging).
 */
export function resolveMessage(
  key: string,
  params?: Record<string, string | number>,
): string {
  const allMessages: Record<string, string> = {
    ...VALIDATION_MESSAGES,
    ...SUCCESS_MESSAGES,
    ...NOTIFICATION_MESSAGES,
    ...UI_ERROR_MESSAGES,
  };
  let msg = allMessages[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      msg = msg.replace(`{${k}}`, String(v));
    }
  }
  return msg;
}
```

**Separation Patterns — Domain vs Presentation:**

| Layer        | Module                    | Returns                                                    | Knows about UI strings?       |
| ------------ | ------------------------- | ---------------------------------------------------------- | ----------------------------- |
| **Domain**   | `shared/businessRules.ts` | Structured error objects: `{ field, messageKey, params? }` | No — returns keys only        |
| **Messages** | `shared/messages.ts`      | Formatted English strings                                  | Yes — owns all UI text        |
| **Consumer** | Components / Server       | Calls `resolveMessage(error.messageKey, error.params)`     | Bridges domain → presentation |

**Refactoring patterns for each category:**

_1. Structurally-coupled functions (already good)_ — `validateHours()`, `validatePTOType()`, etc. already return `{ field, messageKey }`. No change needed.

_2. Presentation-coupled functions_ — Refactor to return structured data:

```typescript
// BEFORE (businessRules.ts):
export function formatLockedMessage(lockedBy: string, lockedAt: string): string {
  return VALIDATION_MESSAGES["month.locked"]
    .replace("{lockedBy}", lockedBy)
    .replace("{lockedAt}", lockedAt);
}

// AFTER (businessRules.ts): pure — no message access
// Remove formatLockedMessage entirely; callers use resolveMessage directly:
//   resolveMessage("month.locked", { lockedBy, lockedAt })

// BEFORE:
export function checkSickDayThreshold(...): string | null {
  if (...) return VALIDATION_MESSAGES["sick.pto_required_after_threshold"];
  return null;
}

// AFTER: returns messageKey, not string
export function checkSickDayThreshold(...): string | null {
  if (...) return "sick.pto_required_after_threshold";
  return null;
}
```

_3. Inline-string functions_ — Refactor to return structured data with message keys:

```typescript
// BEFORE (shouldAutoApproveImportEntry):
violations.push(
  `Sick hours would reach ${projected}h, exceeding ${limit}h annual limit`,
);

// AFTER: new message keys in messages.ts, structured violations
// messages.ts adds:
//   "import.exceed_annual_limit": "{type} hours would reach {projected}h, exceeding {limit}h annual limit"
// businessRules.ts returns:
violations.push({
  messageKey: "import.exceed_annual_limit",
  params: { type: "Sick", projected: String(projected), limit: String(limit) },
});

// BEFORE (getOveruseTooltips):
tooltips.set(
  entry.date,
  `Exceeds accrued PTO — ${available} hours accrued, ${scheduled} scheduled`,
);

// AFTER: new message keys in messages.ts, tooltip returns structured data
// messages.ts adds:
//   "overuse.exceeds_accrued_pto": "Exceeds accrued PTO — {available} hours accrued, {scheduled} scheduled"
//   "overuse.exceeds_annual_limit": "Exceeds annual {type} limit — {scheduled} of {available} hours used"
// businessRules.ts returns:
tooltips.set(entry.date, {
  messageKey: "overuse.exceeds_accrued_pto",
  params: { available: String(available), scheduled: String(scheduled) },
});
// Callers resolve: resolveMessage(tooltip.messageKey, tooltip.params)
```

_4. Consumer migration pattern:_

```typescript
// BEFORE (component):
import {
  VALIDATION_MESSAGES,
  MessageKey,
} from "../../../shared/businessRules.js";
errors.push(
  `${request.date}: ${VALIDATION_MESSAGES[hoursError.messageKey as MessageKey]}`,
);

// AFTER:
import { resolveMessage } from "../../../shared/messages.js";
errors.push(`${request.date}: ${resolveMessage(hoursError.messageKey)}`);
```

**Future i18n extension point:**

`resolveMessage()` becomes the single choke-point for all string resolution. To add locale support later:

1. Change the internal lookup to check `translations[currentLocale]` first, falling back to English.
2. Load locale JSON files via `fetch()` at app startup.
3. No consumer code changes needed — they already go through `resolveMessage()`.

**New message keys required** (for inline strings currently in businessRules.ts):

| Key                                     | Template                                                                                                              | Source function                |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `import.exceed_annual_limit`            | `{type} hours would reach {projected}h, exceeding {limit}h annual limit`                                              | `shouldAutoApproveImportEntry` |
| `import.pto_borrowing_after_first_year` | `PTO borrowing after first year of service requires manual approval (requested {requested}h, available {available}h)` | `shouldAutoApproveImportEntry` |
| `import.pto_exceeds_balance`            | `PTO request exceeds available balance (requested {requested}h, available {available}h)`                              | `shouldAutoApproveImportEntry` |
| `overuse.exceeds_accrued_pto`           | `Exceeds accrued PTO — {available} hours accrued, {scheduled} scheduled`                                              | `getOveruseTooltips`           |
| `overuse.exceeds_annual_limit`          | `Exceeds annual {type} limit — {scheduled} of {available} hours used`                                                 | `getOveruseTooltips`           |

**Discovery Findings:**

- **businessRules.ts structure:**
  - Contains `VALIDATION_MESSAGES` object with 30+ message keys
  - Messages are hardcoded English strings mixed with business constants
  - Used directly in components like `PtoEntryForm` (lines 598, 610, 619, 623, 629)
  - Validation functions return objects with `messageKey` properties that index into `VALIDATION_MESSAGES`

- **Coupling issues:**
  - Domain logic (validation rules) directly references presentation (UI messages)
  - No separation between what to validate vs how to display errors
  - Messages are embedded in shared business logic module
  - No support for internationalization or message customization

- **Usage patterns:**
  - Components import both validation functions and `VALIDATION_MESSAGES`
  - Error display: `VALIDATION_MESSAGES[error.messageKey as MessageKey]`
  - Tests import `VALIDATION_MESSAGES` for assertions
  - Business rules module serves both domain and presentation concerns

- **Impact:** Core business logic tightly coupled to UI presentation, hindering testing and internationalization

**All UI Messages Embedded in Business Logic:**

| Constant                | Keys    | Location (lines) | Description                                                                                                                      |
| ----------------------- | ------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `VALIDATION_MESSAGES`   | 22 keys | 182–238          | Validation error messages with 3 containing `{placeholder}` tokens (`month.locked`, `month.not_ended`, `hours.exceed_carryover`) |
| `SUCCESS_MESSAGES`      | 3 keys  | 225–229          | Success response messages (`pto.created`, `auth.link_sent`, `notification.calendar_lock_sent`)                                   |
| `NOTIFICATION_MESSAGES` | 1 key   | 231–233          | Employee-facing notification messages (`calendar_lock_reminder` with `{month}` placeholder)                                      |
| `UI_ERROR_MESSAGES`     | 2 keys  | 235–238          | Client-side error messages (`failed_to_refresh_pto_data`, `failed_to_load_pto_status`)                                           |

Total: **28 message strings** across 4 constant objects, plus the `MessageKey` type alias (line 240).

Additionally, **6 functions** construct inline English strings that are not in any message constant:

- `shouldAutoApproveImportEntry()` — 4 inline violation strings (e.g., `"Sick hours would reach ${projected}h, exceeding ${limit}h annual limit"`)
- `getOveruseTooltips()` — 2 inline tooltip strings (e.g., `"Exceeds accrued PTO — ${available} hours accrued, ${scheduled} scheduled"`)

**Consumers of message constants:**

| File                                              | Imports                                                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client/components/pto-entry-form/index.ts`       | `VALIDATION_MESSAGES`, `MessageKey` — resolves `messageKey` → UI string in validation                                                                               |
| `client/components/pto-calendar/index.ts`         | `VALIDATION_MESSAGES`, `MessageKey` — resolves `messageKey` → UI string in validation                                                                               |
| `client/pages/admin-monthly-review-page/index.ts` | `SUCCESS_MESSAGES`, `NOTIFICATION_MESSAGES` — toasts and notification content                                                                                       |
| `server/server.mts`                               | `VALIDATION_MESSAGES`, `SUCCESS_MESSAGES`, `NOTIFICATION_MESSAGES`, `MessageKey`, `formatLockedMessage`, `formatMonthNotEndedMessage` — API error/success responses |
| `server/reportGenerators/excelImport.ts`          | `VALIDATION_MESSAGES` — warning messages during import                                                                                                              |
| `server/bulkMigration.ts`                         | `VALIDATION_MESSAGES` — warning messages during bulk migration                                                                                                      |
| `server/dal/PtoEntryDAL.ts`                       | `VALIDATION_MESSAGES` — imported but only `messageKey` strings used in errors                                                                                       |
| `tests/sharedBusinessRules.test.ts`               | `VALIDATION_MESSAGES` — test assertions on message keys                                                                                                             |
| `tests/api-client.test.ts`                        | `VALIDATION_MESSAGES`, `SUCCESS_MESSAGES` — test assertions on expected messages                                                                                    |

**Pure Functions vs Presentation-Coupled Code:**

_Presentation-coupled functions_ (directly produce or access UI strings):
| Function | Coupling | Lines |
|---|---|---|
| `formatLockedMessage()` | Reads `VALIDATION_MESSAGES["month.locked"]`, returns formatted string | 418–425 |
| `formatMonthNotEndedMessage()` | Reads `VALIDATION_MESSAGES["month.not_ended"]`, returns formatted string | 465–470 |
| `checkSickDayThreshold()` | Returns `VALIDATION_MESSAGES["sick.pto_required_after_threshold"]` string directly | 770–778 |
| `checkBereavementThreshold()` | Returns `VALIDATION_MESSAGES["bereavement.pto_required_after_threshold"]` string directly | 785–792 |
| `getOveruseTooltips()` | Constructs inline English tooltip strings (not from message constants) | 1027–1084 |
| `shouldAutoApproveImportEntry()` | Constructs inline English violation strings (not from message constants) | 885–950 |

_Structurally-coupled functions_ (return `{ field, messageKey }` error codes — good pattern, no direct string access):
| Function | Return Shape |
|---|---|
| `validateHours()` | `{ field: "hours", messageKey: "hours.invalid" }` |
| `validateWeekday()` _(deprecated)_ | `{ field: "date", messageKey: "date.weekday" }` |
| `validatePTOType()` | `{ field: "type", messageKey: "type.invalid" }` |
| `validateDateString()` | `{ field: "date", messageKey: "date.invalid" }` |
| `validateAnnualLimits()` | `{ field: "hours", messageKey: "hours.exceed_*" }` |
| `validatePTOBalance()` | `{ field: "hours", messageKey: "hours.exceed_pto_balance" }` |
| `validateDateFutureLimit()` | `{ field: "date", messageKey: "date.future_limit" }` |
| `validateMonthEditable()` | `{ field: "month", messageKey: "month.*", lockedBy, lockedAt }` |
| `validateAdminCanLockMonth()` | `{ field: "month", messageKey: "month.not_ended" \| "date.invalid" }` |

_Pure functions_ (no presentation coupling):
`isAllowedEmailDomain`, `isWorkingDay`, `normalizePTOType`, `getEarliestAdminLockDate`, `getPriorMonth`, `computeAccrualToDate`, `computeEmployeeBalanceData`, `getYearsOfService`, `getPtoRateTier`, `getEffectivePtoRate`, `computeAccrualWithHireDate`, `computeAnnualAllocation`, `computeCarryover`, `computeTerminationPayout`, `getOveruseDates`, `computeMonthlyAccrualRows`

_Pure data/constants_ (no presentation coupling):
`PTOType`, `MONTH_NAMES`, `SYS_ADMIN_EMPLOYEE_ID`, `ENABLE_IMPORT_AUTO_APPROVE`, `ENABLE_BROWSER_IMPORT`, `ALLOWED_EMAIL_DOMAINS`, `PTO_EARNING_SCHEDULE`, `MAX_DAILY_RATE`, `MAX_ANNUAL_PTO`, `CARRYOVER_LIMIT`, `SICK_HOURS_BEFORE_PTO`, `BEREAVEMENT_CONSECUTIVE_DAYS_BEFORE_PTO`, `BUSINESS_RULES_CONSTANTS`, all interfaces (`ValidationError`, `MonthLockValidationError`, `MonthLockInfo`, `PtoRateTier`, `ImportEntryForAutoApprove`, `AutoApproveEmployeeLimits`, `AutoApprovePolicyContext`, `AutoApproveResult`, `AutoApproveImportContext`, `BalanceLimits`, `OveruseEntry`, `MonthlyAccrualRow`)

### Phase 2: Localization Infrastructure

- [ ] Implement localization/i18n system for UI messages
- [ ] Create message key constants and translation files
- [ ] Add locale switching capability
- [ ] Implement message formatting and interpolation
- [ ] Test localization functionality
- [ ] Build passes, lint passes

### Phase 3: Business Rules Purification

- [ ] Extract VALIDATION_MESSAGES from businessRules.ts
- [ ] Refactor business rules to return structured error codes/keys
- [ ] Implement pure functions without UI dependencies
- [ ] Update function signatures to separate data from presentation
- [ ] Add comprehensive type definitions for rule results
- [ ] Manual testing of rule validation

### Phase 4: Component Integration

- [ ] Update components to use localized messages
- [ ] Implement message resolution from business rule results
- [ ] Add error display patterns using localized content
- [ ] Update form validation to use separated concerns
- [ ] Test validation flows with localization
- [ ] Build passes, lint passes

### Phase 5: Testing and Validation

- [ ] Update unit tests for pure business rule functions
- [ ] Add tests for localization and message resolution
- [ ] E2E testing of validation with different locales
- [ ] Performance testing for message loading
- [ ] Code review and internationalization audit
- [ ] Documentation updates
- [ ] Build passes, lint passes, all tests pass

## Implementation Notes

- **Pure Functions**: Business rules return data structures, not UI strings
- **Localization Layer**: Separate module for UI message management
- **Error Codes**: Use structured error objects with message keys
- **Type Safety**: Full TypeScript coverage for rule results and messages
- **Extensibility**: Support for multiple locales and message formats
- **Performance**: Lazy loading of locale data if needed

## Questions and Concerns

1. **How to handle message interpolation with dynamic values?**
   Use `String.replace` for simple placeholders (e.g., `message = 'Min length: ${min}'`; `result = message.replace('${min}', value)`). For robust handling, integrate a lightweight library like `message-format` (polyfill for `Intl.MessageFormat`). Define messages as objects: `{ key: 'Min length: {min}' }`, then format via a utility function: `function formatMessage(key, params) { return new Intl.MessageFormat(messages[key]).format(params); }`. Avoid direct concatenation to prevent XSS; escape params if injecting into DOM.

2. **Should we implement full i18n or just message extraction?**
   Prioritize message extraction to a separate module (e.g., `messages.ts` exporting a const object) for immediate decoupling. Defer full i18n (locale loading, switching) unless multi-language is required now — implement as a thin layer on top (e.g., load JSON via fetch for locales). Keeps codebase lean; extraction alone enables maintainability without over-engineering.

3. **How to maintain backwards compatibility during transition?**
   Not a concern — this is a complete refactor. Replace `VALIDATION_MESSAGES` in `businessRules.ts` directly, update all consumers in one pass. No deprecation layer or fallback paths needed.

4. **What fallback patterns for missing translations?**
   Default to English messages object. In resolver: `function getMessage(key, locale = 'en') { return translations[locale]?.[key] ?? translations.en[key] ?? key; }` (returns key as last resort for debugging). Log missing keys in dev mode. Structure as nested objects for inheritance (e.g., `en-US` extends `en`). Prevents runtime errors; efficient lookup with O(1) access.

5. How to test localization in automated test environments?</content>
