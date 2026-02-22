# Dashboard Navigation Menu

## Description

Implement a navigation menu component to organize the dashboard into modular pages following mobile-first design principles. The menu will allow switching between:

- **Submit Time Off**: Shows the PTO entry form (default page when logged in)
- **Schedule PTO**: Current Year PTO Scheduler
- **Current Year Summary**: PTO, Sick Time, Bereavement, Jury Duty cards
- **Prior Year Summary**: Prior Year Review view
- **Employee Information**: Employee details including hire date and rollover information
- **Logout**: Sign out of the application

The menu component should provide intuitive navigation between these views while maintaining responsive design that works well on mobile devices first, then scales up to larger screens. When users are logged in, they will see the Submit Time Off page by default. If not logged in, they see the login page.

## Priority

🟢 Low Priority

## Checklist

### Stage 1: Design and Planning

- [x] Analyze current index.html structure and identify components for each page
- [x] Design menu component API and event handling for page switching
- [x] Create mobile-first CSS design for menu (hamburger style, collapsible)
- [x] Define page container structure in HTML
- [x] Validation: Design document created, CSS compiles without errors

### Stage 2: Menu Component Implementation

- [x] Create `dashboard-navigation-menu.ts` web component
- [x] Implement navigation buttons with active state management
- [x] Add mobile hamburger menu toggle functionality
- [x] **Menu Toggle**: Implement a hamburger-style menu toggle button that appears as a menu icon when collapsed. Position it statically in the top-right corner of the page for constant access. Default to collapsed state on mobile devices.
- [x] Implement page switching logic with custom events
- [x] Validation: Component renders correctly, unit tests for menu interactions pass

### Stage 3: Page Organization and HTML Restructuring

- [x] Reorganize index.html to group components into page containers
- [x] Create separate Employee Information page with pto-employee-info-card
- [x] Implement default page (Submit Time Off)
- [x] Implement current year summary page (PTO cards)
- [x] Implement prior year summary page (Prior Year Review)
- [x] Implement employee information page
- [x] Integrate menu component into dashboard
- [x] Validation: HTML structure updated, manual testing shows correct page switching

### Stage 4: Responsive Design and Interactions

- [x] Implement mobile-first responsive CSS for menu and pages
- [x] Add touch-friendly interactions for mobile devices
- [x] Ensure proper keyboard navigation support
- [x] Test on various screen sizes and orientations
- [x] Validation: Responsive design works on mobile/tablet/desktop, E2E tests for navigation pass

### Stage 5: Integration, Testing, and Documentation

- [x] Full integration testing with existing dashboard functionality
- [x] Update component imports and app initialization if needed
- [x] Write comprehensive unit tests for menu component
- [x] Update API documentation for any new events
- [x] Manual testing of all navigation paths and edge cases
- [x] Code review and linting passes
- [x] Validation: `pnpm run build` and `pnpm run lint` pass, manual testing complete, documentation updated
- [x] Updated E2E tests to navigate to correct pages after moving employee info card to separate page
- [x] Update `dashboard-navigation-menu.ts` to change the label for the default page from "Default" to "Submit Time Off" to reflect the updated navigation naming convention
- [x] Update `index.html` to remove the "Submit Time Off" button element, as this functionality is now integrated into the navigation menu
- [x] Update `dashboard-navigation-menu.ts` to add a new "Submit Time Off" menu item that emits a "show-pto-form" event to display the PTO entry form, consolidating navigation into the menu component
- [x] Updated `dashboard-navigation-menu.ts` to set "submit-time-off" as the first option
- [x] Updated `UIManager.ts` to set "submit-time-off" as the default page when showing dashboard

### Stage 6: Menu Animation (CSS Animation Policy Compliance)

- [x] Added animation tokens (`--duration-*`, `--easing-*`) to `tokens.css`
- [x] Updated SKILL.md to prefer slide (motion) over fade for menu reveal/hide
- [x] Implemented slide-down open animation using `transform: translateY()` (inline styles per SKILL.md)
- [x] Implemented slide-up close animation with deferred DOM update
- [x] Added `isAnimating` guard to prevent overlapping animations
- [x] Added `prefersReducedMotion()` check queried at animation time, not component init
- [x] Added `@media (prefers-reduced-motion: reduce)` to component CSS
- [x] Used `transitionend` filtered by `e.propertyName === "transform"` to prevent double-fire
- [x] Inline styles cleaned up after each animation completes
- [x] Forced synchronous reflow (`void element.offsetHeight`) between animation phases
- [x] Validation: `pnpm run build` and `pnpm run lint` pass

## Implementation Notes

- Follow existing web component patterns from the project (extend BaseComponent if applicable)
- Use CSS custom properties from `tokens.css` for consistent styling
- Implement mobile-first approach: design for mobile, then enhance for larger screens
- Use semantic HTML for menu structure (nav, ul, li elements)
- Ensure accessibility: proper ARIA labels, keyboard navigation, screen reader support
- Maintain existing functionality while adding navigation - changing default page to Submit Time Off for better user experience
- Consider using CSS Grid or Flexbox for responsive page layouts
- Test on actual mobile devices if possible, not just browser dev tools
- **Menu Toggle**: Implement a hamburger-style menu toggle button that appears as a menu icon when collapsed. Position it statically in the top-right corner of the page for constant access. Default to collapsed state on mobile devices.
- **Logout Integration**: The logout functionality has been integrated into the navigation menu as a separate menu item with distinct styling (red color) and event handling

### Stage 7: Auto-Close Behavior

- [x] Implement document-level click listener to close menu when clicking outside the component
- [x] Implement document-level keydown listener to close menu on Escape key press
- [x] Add listeners when menu opens, remove when menu closes
- [x] Ensure cleanup in `disconnectedCallback` to prevent memory leaks
- [x] Remove auto-close listeners in `selectPage` and `handleLogout` paths
- [x] Verify no interference with existing menu toggle and page selection behavior
- [x] Validation: `pnpm run build` and `pnpm run lint` pass, manual testing confirms auto-close on click outside and Escape

## Questions and Concerns

2.
3.
