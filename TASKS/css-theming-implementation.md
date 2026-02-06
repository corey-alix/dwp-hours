# CSS Theming Implementation

## Description
Implement comprehensive light/dark mode support across all web components in the DWP Hours Tracker application. This feature adapts each component to use the semantic theming system with CSS custom properties, ensuring automatic theme switching based on user system preferences while maintaining accessibility and visual consistency.

## Priority
🟢 Low Priority

## Checklist

### Phase 1: Theme System Foundation
- [x] Define base color palette in CSS custom properties
- [x] Implement semantic color mappings (--color-primary, --color-error, etc.)
- [x] Set up light/dark theme overrides with prefers-color-scheme media queries
- [x] Add component-specific semantic colors (--color-pto-sick, --color-pto-bereavement, etc.)
- [x] Create theme testing utilities
- [x] Update global styles.css with theme foundation

### Phase 2: Admin Panel Component
- [x] Audit admin-panel component for hardcoded colors
- [x] Update navigation background, borders, and text colors to use --color-surface, --color-primary, --color-text
- [x] Test admin-panel theme switching in both light and dark modes
- [x] Validate accessibility contrast ratios
- [x] Update admin-panel component documentation

### Phase 3: Confirmation Dialog Component
- [x] Audit confirmation-dialog component for hardcoded colors
- [x] Update modal background, button colors, and text to use --color-surface, --color-primary, --color-error, --color-text
- [x] Test dialog appearance in both themes
- [x] Ensure proper focus indicators and contrast
- [x] Update confirmation-dialog component documentation

### Phase 4: Data Table Component
- [x] Audit data-table component for hardcoded colors
- [x] Update table headers, rows, borders, and hover states to use --color-surface, --color-text, --color-primary variants
- [x] Test table sorting and pagination theming
- [x] Validate data visibility in both themes
- [x] Update data-table component documentation

### Phase 5: Employee Form Component
- [x] Audit employee-form component for hardcoded colors
- [x] Update form inputs, labels, borders, and validation states to use --color-surface, --color-text, --color-primary, --color-error
- [x] Test form validation styling in both themes
- [x] Ensure input focus states are properly themed
- [x] Update employee-form component documentation

### Phase 6: Employee List Component
- [x] Audit employee-list component for hardcoded colors
- [x] Update list items, action buttons, and status indicators to use --color-surface, --color-text, --color-primary
- [x] Test list interactions and hover states
- [x] Validate status indicator visibility
- [x] Update employee-list component documentation

### Phase 7: PTO Calendar Component
- [ ] Audit pto-calendar component for hardcoded colors
- [ ] Update calendar grid, day cells, and PTO type color coding to use --color-surface, --color-text, and semantic PTO colors
- [ ] Test calendar navigation and date selection
- [ ] Ensure PTO type color coding remains distinguishable
- [ ] Update pto-calendar component documentation

### Phase 8: PTO Request Queue Component
- [ ] Audit pto-request-queue component for hardcoded colors
- [ ] Update request cards, status badges, and action buttons to use --color-surface, --color-text, --color-primary, --color-error
- [ ] Test queue filtering and approval/rejection workflows
- [ ] Validate status badge readability
- [ ] Update pto-request-queue component documentation

### Phase 9: Report Generator Component
- [ ] Audit report-generator component for hardcoded colors
- [ ] Update filter controls, export buttons, and report tables to use --color-surface, --color-text, --color-primary
- [ ] Test report generation and export functionality
- [ ] Ensure table data remains readable
- [ ] Update report-generator component documentation

### Phase 10: PTO Summary Card Component
- [ ] Audit pto-summary-card component for hardcoded colors
- [ ] Update card background, text, and accent colors to use --color-surface, --color-text, --color-primary
- [ ] Test card display and data formatting
- [ ] Validate information hierarchy
- [ ] Update pto-summary-card component documentation

### Phase 11: PTO Accrual Card Component
- [ ] Audit pto-accrual-card component for hardcoded colors
- [ ] Update grid layout, calendar icons, and accrual indicators to use --color-surface, --color-text, --color-primary
- [ ] Test calendar drill-down functionality
- [ ] Ensure accrual data visibility
- [ ] Update pto-accrual-card component documentation

### Phase 12: PTO Sick Card Component
- [ ] Audit pto-sick-card component for hardcoded colors
- [ ] Update card styling and date/hour list formatting to use --color-surface, --color-text, --color-error for sick-specific theming
- [ ] Test sick time tracking display
- [ ] Validate date/hour list readability
- [ ] Update pto-sick-card component documentation

### Phase 13: PTO Bereavement Card Component
- [ ] Audit pto-bereavement-card component for hardcoded colors
- [ ] Update card background and bereavement entry styling to use --color-surface, --color-text, and bereavement-specific semantic colors
- [ ] Test bereavement tracking display
- [ ] Ensure proper bereavement theming
- [ ] Update pto-bereavement-card component documentation

### Phase 14: PTO Jury Duty Card Component
- [ ] Audit pto-jury-duty-card component for hardcoded colors
- [ ] Update card theming and jury duty entry formatting to use --color-surface, --color-text, and jury duty-specific colors
- [ ] Test jury duty tracking display
- [ ] Validate jury duty theming consistency
- [ ] Update pto-jury-duty-card component documentation

### Phase 15: PTO Employee Info Card Component
- [ ] Audit pto-employee-info-card component for hardcoded colors
- [ ] Update info display and metadata styling to use --color-surface, --color-text, --color-primary
- [ ] Test employee information display
- [ ] Ensure information hierarchy and readability
- [ ] Update pto-employee-info-card component documentation

### Phase 16: Integration Testing & Validation
- [ ] Run full E2E test suite to ensure theme compatibility
- [ ] Test theme switching across all components simultaneously
- [ ] Validate accessibility compliance (WCAG contrast ratios)
- [ ] Perform cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Update component test pages to demonstrate theming
- [ ] Final manual testing of complete themed application

### Phase 17: Documentation & Deployment
- [ ] Update README.md with theming implementation details
- [ ] Update component documentation with theming notes
- [ ] Create theme customization guide for future developers
- [ ] Ensure build process includes theme CSS
- [ ] Deploy themed application and validate in production

## Implementation Notes
- Follow the semantic color naming principles from the CSS theming skill
- Use CSS custom properties exclusively for all color definitions
- Maintain accessibility standards with proper contrast ratios in both themes
- Test components individually before integration testing
- Document any component-specific theming decisions
- Ensure theme switching works seamlessly without JavaScript intervention
- Consider performance impact of CSS custom properties across all components
- Reference the Component Adaptation Plan in the README.md "## Theming System" section for specific theming requirements per component
- Follow the CSS theming skill's response pattern for consistent implementation approach</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/css-theming-implementation.md