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
- [ ] Design localization layer for UI messages
- [ ] Create separation patterns for domain vs presentation logic
- [ ] Update architecture-guidance skill with separation patterns
- [ ] Manual review of separation strategy

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
