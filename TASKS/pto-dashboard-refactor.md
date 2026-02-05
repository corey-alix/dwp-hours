# PTO Dashboard Component Separation

## Description
Refactor the monolithic `client/components/pto-dashboard/index.ts` file by moving each of the 7 web components (PtoSummaryCard, PtoAccrualCard, PtoSickCard, PtoBereavementCard, PtoJuryDutyCard, PtoEmployeeInfoCard, plus base classes) into their own dedicated component folders. This improves modularity, maintainability, and alignment with the project's component organization pattern.

## Priority
🟢 Low Priority

## Checklist
- [x] Create individual folders for each component (e.g., `pto-summary-card/`, `pto-accrual-card/`, etc.)
- [x] Extract PtoSummaryCard into `client/components/pto-summary-card/index.ts`
- [x] Extract PtoAccrualCard into `client/components/pto-accrual-card/index.ts`
- [x] Extract PtoSickCard into `client/components/pto-sick-card/index.ts`
- [x] Extract PtoBereavementCard into `client/components/pto-bereavement-card/index.ts`
- [x] Extract PtoJuryDutyCard into `client/components/pto-jury-duty-card/index.ts`
- [x] Extract PtoEmployeeInfoCard into `client/components/pto-employee-info-card/index.ts`
- [x] Move base classes (PtoSectionCard, SimplePtoBucketCard) to `client/components/utils/pto-card-base.ts`
- [x] Update imports in parent files (e.g., dashboard or app files) to reference new component locations
- [x] Update component exports in `client/components/index.ts` if needed
- [x] Run `npm run build` to ensure no compilation errors
- [x] Run `npm run lint` to pass linting checks
- [x] Update unit tests for affected components (no existing unit tests found)
- [x] Update E2E tests (e.g., component-pto-dashboard.spec.ts) to reflect new structure
- [x] Create E2E tests that run the test.html page for each new component folder (e.g., pto-summary-card/test.html, pto-accrual-card/test.html) to ensure isolated component functionality
- [x] Update documentation (e.g., TASKS/README.md or component docs) to reflect new structure
- [x] Code review for consistency with project patterns

## Implementation Notes
- Ensure shared types (e.g., SummaryData, AccrualData) are accessible (consider moving to a shared types file if needed).
- Preserve custom element definitions and registrations.
- Test component isolation to confirm no shared state issues.
- Follow existing folder structures (e.g., include `test.html` and `test.ts` in each new folder if applicable).
- If base classes are widely used, consider making them a separate reusable module.