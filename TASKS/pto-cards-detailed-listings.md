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
- [ ] **Phase 3: Update Dashboard Integration**
  - [ ] Modify loadPTOStatus in app.ts to pass detailed entries to cards
  - [ ] Ensure data is properly filtered by current year
  - [ ] Add loading states for detailed data
  - [ ] Test responsive behavior on mobile devices
  - [ ] Run 'npm run test' to ensure no regressions
- [ ] **Phase 4: Testing and Validation**
  - [ ] Write unit tests for enhanced card components
  - [ ] Add E2E tests for expandable card functionality
  - [ ] Test with various data scenarios (empty, single entry, multiple entries)
  - [ ] Manual testing: Verify date/hour accuracy against database
  - [ ] Cross-browser testing for expandable functionality
  - [ ] Run 'npm run test' to ensure no regressions
- [ ] **Phase 5: Documentation and Polish**
  - [ ] Update component README files with new functionality
  - [ ] Add user-facing help text for expandable cards
  - [ ] Code review and final linting
  - [ ] Performance optimization for large entry lists
  - [ ] Update API documentation if needed
  - [ ] Run 'npm run test' to ensure no regressions

## Implementation Notes
- Follow existing patterns from pto-accrual-card for expandable functionality
- Use the same data structure as current usageEntries (array of { date: string; hours: number })
- Ensure detailed listings are sorted by date (newest first or oldest first)
- Consider pagination or virtual scrolling if entry lists become very long
- Maintain accessibility standards for expandable content
- Use existing theming system for consistent styling

## Questions and Concerns
1. Should the detailed listings show all historical entries or only current year?
2. How should the expandable toggle be visually indicated (chevron, "Show Details" text, etc.)?
3. Should there be a limit on the number of entries shown before requiring scrolling?
4. How should entries with the same date but different hours be displayed (combine or show separately)?
5. Should the detailed view include entry creation dates or just usage dates?</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-cards-detailed-listings.md