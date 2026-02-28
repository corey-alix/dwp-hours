# Business Rules Separation

## Description

Separate UI messages (VALIDATION_MESSAGES) from core business logic in shared/businessRules.ts. Extract messages to a localization layer and keep rules pure functions. Decouple domain logic from presentation concerns.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Analysis and Design

- [x] Analyze current businessRules.ts structure and dependencies
- [ ] Document all UI messages embedded in business logic
- [ ] Identify pure functions vs presentation-coupled code
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

1. How to handle message interpolation with dynamic values?
2. Should we implement full i18n or just message extraction?
3. How to maintain backwards compatibility during transition?
4. What fallback patterns for missing translations?
5. How to test localization in automated test environments?</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/jupiter/TASKS/business-rules-separation.md
