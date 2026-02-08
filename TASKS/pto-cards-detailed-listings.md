# PTO Cards Detailed Listings

## Description
Enhance the Sick, Bereavement, and Jury Duty PTO cards to show detailed date and hour listings when expanded or clicked. Currently these cards only show summary information (used/remaining hours). This feature will add the ability to view individual PTO entries with dates and hours for better transparency and tracking.

## Priority
🟢 Low Priority

## Checklist
- [ ] **Phase 1: Design Component Enhancement**
  - [ ] Analyze current PTO card components (pto-sick-card, pto-bereavement-card, pto-jury-duty-card)
  - [ ] Design expandable/collapsible interface for showing detailed listings
  - [ ] Determine data structure needed for date/hour entries
  - [ ] Plan responsive design for detailed listings
  - [ ] Run 'npm run test' to ensure no regressions
- [x] **Phase 2: Update PTO Card Components**
  - [x] Modify pto-sick-card to accept and display detailed usage entries
  - [x] Modify pto-bereavement-card to accept and display detailed usage entries
  - [x] Modify pto-jury-duty-card to accept and display detailed usage entries
  - [x] Add expandable toggle functionality to each card
  - [x] Style detailed listings to match existing design patterns
  - [x] Run 'npm run test' to ensure no regressions
- [x] **Phase 3: Update Dashboard Integration**
  - [x] Modify loadPTOStatus in app.ts to pass detailed entries to cards
  - [x] Ensure data is properly filtered by current year
  - [x] Add loading states for detailed data
  - [x] Test responsive behavior on mobile devices
  - [x] Run 'npm run test' to ensure no regressions
- [x] **Phase 4: Testing and Validation**
  - [x] Write unit tests for enhanced card components (test toggle functionality, data rendering, loading states)
  - [x] Add E2E tests for expandable card functionality (click toggle, verify detailed listings appear/hide)
  - [x] Test with various data scenarios (empty entries, single entry, multiple entries, different years)
  - [x] Manual testing: Verify date/hour accuracy against database using test data
  - [x] Cross-browser testing for expandable functionality (Chrome, Firefox, Safari)
  - [x] Test responsive behavior on mobile devices (verify vertical stacking of date/hours)
  - [x] Run 'npm run test' to ensure no regressions
- [x] **Phase 5: Documentation and Polish**
  - [x] Update component README files with new expandable functionality and interactive dates
  - [x] Add user-facing help text for expandable cards ("Click dates to view in calendar")
  - [x] Code review and final linting (check for unused imports, consistent formatting)
  - [x] Performance optimization for large entry lists (consider virtual scrolling if > 20 entries)
  - [x] Update API documentation if needed (pto entry filtering behavior)
  - [x] Add JSDoc comments for new methods and event handlers
  - [x] Run 'npm run test' to ensure no regressions
- [x] **Phase 6: Interactive Date Navigation**
  - [x] Add missing `--color-focus: var(--color-primary)` token to `client/tokens.css`
  - [x] Update `SimplePtoBucketCard` base class to make date entries clickable (`cursor: pointer`, hover effects)
  - [x] Style clickable dates: `text-decoration: underline`, hover background, focus outline
  - [x] Add click event handlers to date elements that dispatch CustomEvent with month/year data
  - [x] Update pto-accrual-card to listen for 'navigate-to-month' custom events
  - [x] Implement month navigation logic in pto-accrual-card (find and click appropriate month button)
  - [x] Add visual feedback for clickable date entries (underline, hover background)
  - [x] Ensure accessibility (keyboard navigation, screen reader support for clickable dates)
  - [x] Test date-to-calendar navigation functionality across different months
  - [x] Run 'npm run test' to ensure no regressions

## Implementation Notes
- Follow existing patterns from pto-accrual-card for expandable functionality
- Use the same data structure as current usageEntries (array of { date: string; hours: number })
- Ensure detailed listings are sorted by date (newest first or oldest first)
- Consider pagination or virtual scrolling if entry lists become very long
- Maintain accessibility standards for expandable content
- Use existing theming system for consistent styling
- **NEW**: Make "Dates Used" entries clickable to open the calendar for the month containing that date

## Questions and Concerns
1. ~~Should the detailed listings show all historical entries or only current year?~~ **RESOLVED**: Current year only (implemented via `buildUsageEntries()` filtering)
2. ~~How should the expandable toggle be visually indicated (chevron, "Show Details" text, etc.)?~~ **RESOLVED**: "Show Details"/"Hide Details" text with chevron (▼) - implemented in base class
3. ~~Should there be a limit on the number of entries shown before requiring scrolling?~~ **RESOLVED**: No limit - show all entries (performance monitoring recommended for large datasets)
4. ~~How should entries with the same date but different hours be displayed (combine or show separately)?~~ **RESOLVED**: Show separately (should not happen in normal usage)
5. ~~Should the detailed view include entry creation dates or just usage dates?~~ **RESOLVED**: Usage dates only
6. **NEW**: How should clickable date entries be visually distinguished (underline, cursor pointer, hover effects)? **FINDINGS**: Based on design system analysis:
   - **Missing Token Issue**: `--color-focus` token is used in base card component but not defined in `tokens.css` - should be added
   - **Focus Patterns**: Inconsistent across components:
     - `pto-card-base.ts`: `outline: 2px solid var(--color-focus)` (token missing)
     - `employee-list`: `border-color: var(--color-primary); box-shadow: 0 0 0 2px var(--color-primary-light)`
     - `confirmation-dialog`: `outline: 2px solid var(--color-primary)`
   - **Recommended for Clickable Dates**:
     - `cursor: pointer` for clickability indication
     - `text-decoration: underline` to indicate interactive/link-like behavior
     - Focus: `outline: 2px solid var(--color-primary)` (consistent with confirmation-dialog)
     - Hover: `background: var(--color-surface-hover)` for subtle feedback
     - Add `--color-focus: var(--color-primary)` to `tokens.css` for consistency
   - **Validation**: All tests pass after adding missing focus token, confirming no regressions introduced</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-cards-detailed-listings.md