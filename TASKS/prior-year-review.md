# Prior Year Review

## Description
Implement a prior year review feature that allows users to view PTO data from previous years. This should render all twelve months (January → December) in a grid layout for the prior year, showing PTO usage, accruals, and balances for historical review. The feature should be implemented as a dedicated web component integrated into the main dashboard.

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
- [ ] **Phase 2: Create Prior Year Review Web Component**
  - [ ] Create `prior-year-review` web component in client/components/
  - [ ] Implement 12-month grid layout (January-December)
  - [ ] Add year selector dropdown (previous years only)
  - [ ] Integrate with existing PTO calculation logic
  - [ ] Style component to match existing dashboard theme
  - [ ] Add loading states and error handling
  - [ ] Run 'npm run test' to ensure no regressions
- [ ] **Phase 3: Integrate into Dashboard**
  - [ ] Add prior year review component to index.html
  - [ ] Update dashboard navigation to include prior year view
  - [ ] Ensure responsive design works on mobile devices
  - [ ] Add toggle between current year and prior year views
  - [ ] Run 'npm run test' to ensure no regressions
- [ ] **Phase 4: Testing and Validation**
  - [ ] Write unit tests for the web component
  - [ ] Add E2E tests for prior year review functionality
  - [ ] Test with various historical data scenarios
  - [ ] Manual testing: Verify data accuracy against database
  - [ ] Cross-browser testing
  - [ ] Run 'npm run test' to ensure no regressions
- [ ] **Phase 5: Documentation and Polish**
  - [ ] Update README.md with implementation details
  - [ ] Add component documentation
  - [ ] Update user-facing help text if needed
  - [ ] Code review and final linting
  - [ ] Performance optimization if needed
  - [ ] Run 'npm run test' to ensure no regressions

## Implementation Notes
- Use existing PTO calculation functions from shared/businessRules.ts
- Follow the same data patterns as current year dashboard
- Consider caching historical data to improve performance
- Ensure the component works with the theming system
- Year selector should default to previous year
- Handle cases where user has no data for certain years
- Integrate with existing error handling and notification systems

## Phase 1 Implementation Insights
- **API Response Structure**: The endpoint returns both detailed PTO entries per month and summary statistics, providing flexibility for frontend rendering (calendar view vs summary view)
- **Data Aggregation**: Current implementation filters PTO entries in memory after database query; suitable for current data volumes but could be optimized with database-level aggregation if needed
- **Year Validation**: Range validation (current year - 10 to current year - 1) prevents unreasonable requests while allowing reasonable historical access
- **Type Safety**: Added comprehensive TypeScript interfaces ensuring type safety across API boundaries
- **Testing**: Unit tests required updating the test route setup to include new endpoints, ensuring test infrastructure stays current
- **Performance**: No caching implemented as requested; consider monitoring query performance as data grows

## Questions and Concerns
1. Should the prior year review show the same detailed breakdown as the current year (calendar views, specific dates for sick/bereavement/jury duty)?
   **Decision**: Yes, it will look similar to the Corey Alix 2025.xlsx as described by SKILL.md and as can be discovered using migrate.ts with the --debug flag; color coding the dates and placing hours in the corners is enough. All 12 months go into a flex/grid so they flow responsively with a maximum of 3 months in a single row.

2. How should we handle year selection - dropdown, buttons, or calendar picker?
   **Decision**: "Prior Year" is enough for now

3. Should there be a limit on how far back users can view (e.g., last 5 years, 10 years)?
   **Decision**: 1 year

4. How should the component handle users with no historical data?
   **Decision**: "No data found"

5. Should the prior year view be read-only, or allow any interactions (like viewing details)?
   **Decision**: Yes, prior year is readonly

6. How should we handle timezone considerations for historical data display?
   **Decision**: there will be no time component, just dates

7. Should we cache historical calculations to improve performance?
   **Decision**: no</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/prior-year-review.md