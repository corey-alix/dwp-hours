# DWP Hours Tracker - Task Overview

## Overview

This document outlines all remaining tasks to complete the DWP Hours Tracker application. Tasks are organized by priority and dependency.

## Task Priority Order

### 🔥 High Priority (Foundation - Complete First)

1. ✅ **[database-schema.md](database-schema.md)** - Complete database schema
2. ✅ **[authentication.md](authentication.md)** - Implement real authentication
3. ✅ **[pto-calculations.md](pto-calculations.md)** - PTO status calculations
4. ✅ **[api-endpoints.md](api-endpoints.md)** - Complete API endpoints
5. # ✅ **[issue-date-handling-regression.md](issue-date-handling-regression.md)** - Fix timezone-related date shifting bugs
6. ✅ **[issue-endless-loop-employee-acknowledge.md](issue-endless-loop-employee-acknowledge.md)** - Fix endless loop in AdminPanel event handling
7. ✅ **[issue-search-input-focus-regression.md](issue-search-input-focus-regression.md)** - Search input loses focus on type in employee-list component
8. ✅ **[issue-maximum-call-stack-regression.md](issue-maximum-call-stack-regression.md)** - Fix maximum call stack exceeded error in employee-workflow test
9. **[admin-panel.md](admin-panel.md)** - Defect: Edit button does not open employee form (missing `employee-edit` event listener)
10. ✅ **[issue-prior-year-summary-color-regression.md](issue-prior-year-summary-color-regression.md)** - Fix summary value color inconsistency between scheduler and prior year review
11. LATER: See ./TASKS/secure-magic-link-tokens.md for details
12. See ./TASKS/issue-prior-year-pto-leaking.md for details — prior year PTO data leaking into current year summary calculations

### 🟡 Medium Priority (Backend/API Core Features)

6. ✅ **[testing-suite.md](testing-suite.md)** - Testing implementation
7. ✅ **[data-migration.md](data-migration.md)** - Legacy data migration (see [`.github/skills/pto-spreadsheet-layout/SKILL.md`](../.github/skills/pto-spreadsheet-layout/SKILL.md) for spreadsheet structure reference)
8. ✅ **[security-production.md](security-production.md)** - Security & production features
9. ✅ **[design-constraints.md](design-constraints.md)** - Code quality improvements and design constraint compliance
10. ✅ **[database-reset-reload-service.md](database-reset-reload-service.md)** - Deterministic DB reload for consistent E2E
11. REVISIT **[planet-branch-workflow.md](planet-branch-workflow.md)** - Standardized feature development workflow using planet branches
12. LATER: See ./TASKS/current-year-pto-scheduler.md for details
13. LATER: See ./TASKS/color-contrast-compliance.md for details

### 🟢 Low Priority (Frontend/UI Features)

11. ✅ **[admin-review-acknowledgment.md](admin-review-acknowledgment.md)** - Admin review acknowledgment
12. # ✅ **[issue-submit-time-off-calendar-regressions.md](issue-submit-time-off-calendar-regressions.md)** - Submit Time Off calendar missing features
13. **[planet-branch-workflow.md](planet-branch-workflow.md)** - Standardized feature development workflow using planet branches
14. **[issue-pto-card-base-migration.md](issue-pto-card-base-migration.md)** - Migrate PTO card hierarchy from HTMLElement to BaseComponent with declarative rendering
15. LATER: See ./TASKS/pto-calendar-keyboard-navigation.md for details
16. LATER: See ./TASKS/pto-calendar-flashing-fix.md for details
17. LATER: See ./TASKS/pto-accrual-card-fixes.md for details
18. See ./TASKS/live-summary-delta-scheduler.md for details — live summary delta display in PTO scheduler
19. See ./TASKS/zero-hour-pto-unschedule.md for details — API support for 0-hour PTO requests to unschedule entries
20. DONE (Stages 1–4 complete, Stage 5 pending): See ./TASKS/app-run-entry-point.md for details — explicit App.run() entry point (prerequisite for TraceListener controller architecture)
21. DONE (TraceListener, controllers, pto-notification, debug-console refactor complete; Stage 5 integration testing remains): See ./TASKS/debug-console-component.md for details
22. LATER: See ./TASKS/migrate-prior-year-review-to-base-component.md for details
23. LATER: See ./TASKS/dashboard-navigation-menu.md for details
24. DONE: See ./TASKS/pto-entry-form-calendar-enhancements.md for details
25. LATER: See ./TASKS/pto-entry-form-summary-slot.md for details — named slot for PTO summary card inside entry form
26. LATER: See ./TASKS/month-summary-component.md for details — extract month summary into reusable web component
27. LATER: See ./TASKS/pto-summary-balance-slot.md for details — slot a month-summary into pto-summary-card showing remaining PTO balances
28. LATER: See ./TASKS/ui-page-consolidation.md for details — consolidate dashboard pages (remove Schedule PTO & Employee Info pages, relocate components, re-wire navigate-to-month)
29. LATER: See ./TASKS/pto-entry-form-multi-calendar.md for details — render all 12 months in pto-entry-form on large viewports (≥960px)
30. LATER: See ./TASKS/ui-router-migration.md for details — decouple UIManager from concrete pages via a type-safe client-side router
31. LATER: See ./TASKS/calendar-header-navigation.md for details — move month navigation buttons to flank the month name above the calendar
32. LATER: See ./TASKS/month-summary-interactive-pto-type.md for details — interactive PTO type selection via month-summary headers (replaces calendar legend in multi-calendar mode)
33. DONE: See ./TASKS/admin-review-month-summary-integration.md for details — replace bespoke hours breakdown in admin-monthly-review with reusable month-summary component showing available−scheduled balances
34. LATER: See ./TASKS/consolidate-pto-cards.md for details — replace four PTO card components with month-summary balances + unified detail card
35. LATER: See ./TASKS/employee-name-info-card.md for details — display employee name as first row in pto-employee-info-card on current year summary page

## Task Dependencies

```
database-schema.md
├── authentication.md
├── pto-calculations.md
├── issue-date-handling-regression.md
└── api-endpoints.md
    ├── testing-suite.md
    ├── data-migration.md
    ├── security-production.md
    ├── admin-panel.md (incomplete)
    └── admin-review-acknowledgment.md
```

## Current Status Summary

### ✅ Completed

- Project scaffolding and build system
- Basic Express server with CORS
- Frontend UI structure (HTML/CSS/TypeScript)
- Basic API routes (health, PTO CRUD, employee CRUD)
- Database connection with sql.js
- TypeScript compilation and linting
- Database schema implementation
- Authentication system implementation
- PTO calculations and status logic
- Core API endpoints implementation (some admin endpoints still missing)
- Comprehensive testing suite (unit, integration, E2E)
- Data migration tools (legacy spreadsheet import)
- Security & production features (helmet, rate limiting, input validation, PM2)
- Admin panel UI (complete web components implementation with E2E testing)
- Design constraints compliance (type safety and code quality improvements)
- Production deployment
- Declarative UI elements
- Tailwind styling for PTO employee info card
- Planet branch workflow

## Implementation Guidelines

**Priority Focus: Backend/API First** - Complete all backend and API functionality before implementing frontend features. This ensures a solid foundation and API contract before building user interfaces.

### Task Completion Criteria

- [ ] All checklist items completed
- [ ] Code builds without errors (`npm run build`)
- [ ] Linting passes (`npm run lint`)
- [ ] Basic functionality tested manually
- [ ] Documentation updated

### Code Quality Standards

- TypeScript strict mode compliance
- Proper error handling
- Input validation
- Security best practices
- Clean, readable code

### Design Constraints

- Use `querySingle` instead of `getElementById` for DOM element queries to ensure errors are thrown if elements are not found
- Do not use type casting (e.g., `as any`). Web components have specific types (e.g., `PtoEntryForm` for `pto-entry-form` elements) - use them for strong typing
- `<any>` should be a last resort; leverage TypeScript's strict mode and proper type definitions for DOM elements

### Testing Requirements

- Manual testing of new features
- API endpoint testing
- Frontend integration testing
- Error case handling

## Next Steps

1. ✅ **database-schema.md** - foundation completed
2. ✅ **authentication.md** - secure access implemented
3. ✅ **pto-calculations.md** - core business logic completed
4. ✅ **api-endpoints.md** - core backend functionality completed (some admin endpoints missing)
5. ✅ **testing-suite.md** - comprehensive testing suite implemented
6. ✅ **data-migration.md** - legacy data migration completed
7. ✅ **security-production.md** - production readiness completed
8. **admin-panel.md** - admin UI features (incomplete - missing event handling for PTO request approve/reject)
9. ✅ **issue-date-handling-regression.md** - critical date handling bug fix needed
10. ✅ **design-constraints.md** - code quality improvements needed
11. ✅ **admin-review-acknowledgment.md** - admin review UI
12. **planet-branch-workflow.md** - standardized feature development workflow
13. ✅ **issue-submit-time-off-calendar-regressions.md** - submit time off calendar missing features
14. # ✅ **issue-test-file-conventions-regression.md** - fix test file conventions regression
15. **issue-date-handling-regression.md** - critical date handling bug fix needed
16. **design-constraints.md** - code quality improvements needed
17. Implement **admin-review-acknowledgment.md** - admin review UI
18. ✅ **issue-test-file-conventions-regression.md** - fix test file conventions regression
19. ✅ **issue-endless-loop-employee-acknowledge.md** - fix endless loop in AdminPanel event handling
20. **esbuild-css-bundling.md** - implement esbuild CSS bundling to fix missing atomic.css in build
21. LATER: See ./TASKS/pto-balance-summary-component.md for details
22. DONE: See ./TASKS/sticky-pto-form-elements.md for details

Each task file contains detailed checklists for implementation steps.</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/README.md
