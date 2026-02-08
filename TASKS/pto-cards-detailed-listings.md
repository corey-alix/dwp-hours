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
- [ ] **Phase 4: Testing and Validation**
  - [ ] Write unit tests for enhanced card components (test toggle functionality, data rendering, loading states)
  - [ ] Add E2E tests for expandable card functionality (click toggle, verify detailed listings appear/hide)
  - [ ] Test with various data scenarios (empty entries, single entry, multiple entries, different years)
  - [ ] Manual testing: Verify date/hour accuracy against database using test data
  - [ ] Cross-browser testing for expandable functionality (Chrome, Firefox, Safari)
  - [ ] Test responsive behavior on mobile devices (verify vertical stacking of date/hours)
  - [ ] Run 'npm run test' to ensure no regressions
- [ ] **Phase 5: Documentation and Polish**
  - [ ] Update component README files with new expandable functionality and interactive dates
  - [ ] Add user-facing help text for expandable cards ("Click dates to view in calendar")
  - [ ] Code review and final linting (check for unused imports, consistent formatting)
  - [ ] Performance optimization for large entry lists (consider virtual scrolling if > 20 entries)
  - [ ] Update API documentation if needed (pto entry filtering behavior)
  - [ ] Add JSDoc comments for new methods and event handlers
  - [ ] Run 'npm run test' to ensure no regressions
- [ ] **Phase 6: Interactive Date Navigation**
  - [x] Add missing `--color-focus: var(--color-primary)` token to `client/tokens.css`
  - [ ] Update `SimplePtoBucketCard` base class to make date entries clickable (`cursor: pointer`, hover effects)
  - [ ] Style clickable dates: `text-decoration: underline`, hover background, focus outline
  - [ ] Add click event handlers to date elements that dispatch CustomEvent with month/year data
  - [ ] Update pto-accrual-card to listen for 'navigate-to-month' custom events
  - [ ] Implement month navigation logic in pto-accrual-card (find and click appropriate month button)
  - [ ] Add visual feedback for clickable date entries (underline, hover background)
  - [ ] Ensure accessibility (keyboard navigation, screen reader support for clickable dates)
  - [ ] Test date-to-calendar navigation functionality across different months
  - [ ] Run 'npm run test' to ensure no regressions

## Implementation Notes
- Follow existing patterns from pto-accrual-card for expandable functionality
- Use the same data structure as current usageEntries (array of { date: string; hours: number })
- Ensure detailed listings are sorted by date (newest first or oldest first)
- Consider pagination or virtual scrolling if entry lists become very long
- Maintain accessibility standards for expandable content
- Use existing theming system for consistent styling
- **NEW**: Make "Dates Used" entries clickable to open the calendar for the month containing that date

## Key Learnings from Implementation

### Component Architecture
- **Base Class Pattern**: `SimplePtoBucketCard` provides expandable functionality, toggle buttons, and detailed listings rendering
- **Data Properties**: Cards receive data through `bucket` (summary data) and `usageEntries` (detailed entries) properties
- **Attribute Observation**: Subclasses must observe "expanded" attribute for toggle functionality to work
- **Event Handling**: Toggle button clicks are handled internally by the base class

### Dashboard Integration
- **Dynamic Creation**: Cards are created programmatically in `loadPTOStatus()` and `renderPTOStatus()` methods
- **Loading States**: Cards show "Loading..." when `bucket` data is null, providing good UX during data fetch
- **Data Flow**: `buildUsageEntries()` filters entries by year and type, returning `{date, hours}[]` format
- **DOM Updates**: Cards are appended to `.pto-summary` container and updated when data arrives

### Styling & Responsiveness
- **CSS Custom Properties**: Uses design tokens like `var(--color-primary)`, `var(--space-md)`, etc.
- **Mobile-First**: Added `@media (max-width: 480px)` for vertical stacking of date/hours on small screens
- **Consistent Theming**: Detailed listings match existing card styling patterns

### Testing Strategy
- **Component Tests**: Individual `.test.ts` files for each card component
- **E2E Tests**: Playwright tests in `e2e/` directory cover full user workflows
- **Data Setup**: Test files include realistic PTO data scenarios for validation
- **Loading Verification**: Browser logs confirm loading states and data updates

### Performance Considerations
- **Large Entry Lists**: Current implementation renders all entries at once. For users with many PTO entries, consider:
  - Virtual scrolling for lists > 20 entries
  - Pagination (show 10 entries at a time with "Show More" button)
  - Lazy loading of detailed data only when expanded
- **Memory Usage**: Each card stores full entry arrays - monitor for memory issues with large datasets
- **DOM Performance**: Many list items may impact rendering performance on low-end devices

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
     - Add `--color-focus: var(--color-primary)` to `tokens.css` for consistency</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-cards-detailed-listings.md