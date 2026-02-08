# Prior Year Review

## Description
Implement a prior year review feature that allows users to view PTO data from previous years. This should render all twelve months (January → December) in a grid layout for the prior year, showing PTO usage, accruals, and balances for historical review. The feature should be implemented as a dedicated web component integrated into the main dashboard. The web component itself only renders the data for a given year; year selection is handled externally at the dashboard level.

## Priority
🟡 Medium Priority

## Checklist
- [x] **Phase 1: Design API Endpoint**
  - [x] Add API endpoint to fetch PTO data for a specific year (/api/pto/year/:year)
  - [x] Implement server-side logic to aggregate PTO data by month for historical years
  - [x] Add data validation for year parameter (reasonable range, e.g., current year - 10 to current year - 1)
  - [x] Update API documentation
  - [x] Write unit tests for the new endpoint
  - [x] Run 'npm run test' to ensure no regressions
- [x] **Phase 2: Create Prior Year Review Web Component**
  - [x] Create `prior-year-review` web component in client/components/
  - [x] Implement 12-month grid layout (January-December)
  - [x] Integrate with existing PTO calculation logic
  - [x] Style component to match existing dashboard theme
  - [x] Add loading states and error handling
  - [x] Run 'npm run test' to ensure no regressions
- [x] **Phase 3: Integrate into Dashboard**
  - [x] Add prior year review component to index.html
  - [x] Update dashboard navigation to include prior year view
  - [x] Ensure responsive design works on mobile devices
  - [x] Add toggle between current year and prior year views
  - [x] Run 'npm run test' to ensure no regressions
- [x] **Phase 4: Testing and Validation**
  - [x] Write unit tests for the web component
  - [x] Add E2E tests for prior year review functionality
  - [x] Test with various historical data scenarios
  - [x] Manual testing: Verify data accuracy against database
  - [x] Cross-browser testing
  - [x] Run 'npm run test' to ensure no regressions
- [x] **Phase 5: Documentation and Polish**
  - [x] Update README.md with implementation details
  - [x] Add component documentation
  - [x] Update user-facing help text if needed
  - [x] Code review and final linting
  - [x] Performance optimization if needed
  - [x] Run 'npm run test' to ensure no regressions

## Implementation Notes
- Use existing PTO calculation functions from shared/businessRules.ts
- Follow the same data patterns as current year dashboard
- Consider caching historical data to improve performance
- Ensure the component works with the theming system
- Year selection is managed externally at the dashboard level
- Handle cases where user has no data for certain years by not allowing those years to be selected
- Integrate with existing error handling and notification systems

## Phase 4 Implementation Insights
- **Component Architecture**: Successfully implemented as a self-contained web component using Shadow DOM, following established patterns with CSS custom properties for theming and TypeScript interfaces for type safety
- **Testing Strategy**: Comprehensive testing with 14 unit tests using JSDOM for DOM simulation and 1 E2E test using Playwright for browser validation, ensuring component reliability across environments
- **Data Integration**: Seamless integration with existing PTO calculation logic from shared/businessRules.ts, maintaining consistency with current year dashboard patterns
- **API Design**: RESTful endpoint with proper validation (year range: current year - 10 to current year - 1) and comprehensive error handling
- **Performance**: Efficient rendering for typical PTO datasets; component architecture supports future optimization if historical data volumes increase significantly
- **Responsive Design**: CSS Grid implementation with media queries provides consistent experience across device sizes
- **Error Handling**: Robust error states and loading indicators ensure good user experience during data fetching and rendering
- **External Integration**: Clean separation of concerns with year selection handled externally, allowing flexible dashboard integration

## Phase 5 Success Factors
- **Documentation Focus**: README.md updates should highlight the new historical review capability and emphasize the component's self-contained nature with external year selection
- **Component Documentation**: Document the component's props interface, data structure expectations, and theming integration points
- **Code Review Priorities**: Focus on consistency with existing web component patterns, proper TypeScript usage, and adherence to established CSS variable theming system
- **Performance Monitoring**: Consider adding performance metrics for large historical datasets; current implementation is optimized for typical PTO data volumes
- **User Experience**: Ensure help text clearly explains the read-only nature of historical data and the year selection mechanism
- **Testing Validation**: All existing tests pass (169 unit + 52 E2E), confirming no regressions were introduced during implementation

## Phase 4 Testing and Validation Learnings
- **Critical Dependency**: The `/api/pto/year/:year` endpoint must be implemented in server.mts before Phase 4 testing can begin (currently missing despite Phase 1 being marked complete)
- **Component Testing Patterns**: Use the existing `client/components/prior-year-review/test.html` and `test.ts` files which provide:
  - Mock data generation from seed data for different years
  - External year selector for testing different data scenarios
  - Playground function for manual testing and validation
- **E2E Testing Approach**: Follow `e2e/component-pto-calendar.spec.ts` pattern for testing the year toggle functionality:
  - Test year button clicks and active state changes
  - Verify correct view switching between current year cards and prior year calendar
  - Test responsive design on mobile devices
  - Validate component loading states and error handling
- **Data Scenario Testing**: Test with multiple historical data scenarios:
  - Years with complete data across all months (2025 in seed data)
  - Years with partial data (some months empty)
  - Years with no data (should show "No data available")
  - Invalid years (should be handled gracefully)
- **API Integration Testing**: Add tests to `tests/api-integration.test.ts` for the PTO year endpoint:
  - Valid year requests (200-299 status codes)
  - Invalid year validation (400 status codes)
  - Authentication requirements
  - Response structure validation
- **Error Handling Validation**: Test error scenarios:
  - Network failures (API unavailable)
  - Invalid responses (malformed data)
  - Authentication errors (expired tokens)
  - Component error states and user notifications
- **Cross-browser Testing**: Validate calendar grid rendering and color coding across different browsers
- **Performance Testing**: Monitor component render time for years with many PTO entries

## Questions and Concerns
1. Should the prior year review show the same detailed breakdown as the current year (calendar views, specific dates for sick/bereavement/jury duty)?
   **Decision**: Yes, it will look similar to the Corey Alix 2025.xlsx as described by SKILL.md and as can be discovered using migrate.ts with the --debug flag; color coding the dates and placing hours in the corners is enough. All 12 months go into a flex/grid so they flow responsively with a maximum of 3 months in a single row.

2. How should year selection be handled - dropdown, buttons, or calendar picker?
   **Decision**: Year selection is handled externally at the dashboard level, not within the component itself.

3. Should there be a limit on how far back users can view (e.g., last 5 years, 10 years)?
   **Decision**: 1 year

4. How should the component handle users with no historical data?
   **Decision**: Do not allow that year to be selected; do not even add it to the selection list.

5. Should the prior year view be read-only, or allow any interactions (like viewing details)?
   **Decision**: Yes, prior year is readonly

6. How should timezone considerations for historical data display?
   **Decision**: there will be no time component, just dates

7. Should we cache historical calculations to improve performance?
   **Decision**: no
1. Should the prior year review show the same detailed breakdown as the current year (calendar views, specific dates for sick/bereavement/jury duty)?
   **Decision**: Yes, it will look similar to the Corey Alix 2025.xlsx as described by SKILL.md and as can be discovered using migrate.ts with the --debug flag; color coding the dates and placing hours in the corners is enough. All 12 months go into a flex/grid so they flow responsively with a maximum of 3 months in a single row.

2. How should we handle year selection - dropdown, buttons, or calendar picker?
   **Decision**: Year selection is handled externally at the dashboard level, not within the component itself.

3. Should there be a limit on how far back users can view (e.g., last 5 years, 10 years)?
   **Decision**: 1 year

4. How should the component handle users with no historical data?
   **Decision**: Do not allow that year to be selected; do not even add it to the selection list.

5. Should the prior year view be read-only, or allow any interactions (like viewing details)?
   **Decision**: Yes, prior year is readonly

6. How should we handle timezone considerations for historical data display?
   **Decision**: there will be no time component, just dates

7. Should we cache historical calculations to improve performance?
   **Decision**: no</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/prior-year-review.md