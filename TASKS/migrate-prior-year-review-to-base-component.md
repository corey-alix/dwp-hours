# Migrate Prior Year Review to BaseComponent

## Description

Migrate the `prior-year-review` web component from extending `HTMLElement` directly to extending `BaseComponent`. This ensures consistency with the project's web component architecture, prevents memory leaks from event listeners, and follows the reactive update cycle pattern.

## Priority

🟢 Low Priority

## Checklist

- [x] Update component class to extend `BaseComponent` instead of `HTMLElement`
- [x] Remove manual `attachShadow()` call from constructor
- [x] Change `render()` method to return a template string instead of setting `innerHTML`
- [x] Update `data` setter to call `requestUpdate()` instead of `render()`
- [x] Remove `attachEventListeners()` method (handled by BaseComponent)
- [x] Update imports to include `BaseComponent`
- [x] Test component rendering with sample data
- [x] Verify calendar display and styling remain correct
- [x] Run existing tests to ensure no regressions
- [x] Update component documentation if needed
- [x] Manual testing of prior year review functionality
- [x] Code review and linting

## Implementation Notes

- Follow the migration guidelines in [.github/skills/web-components-assistant/SKILL.md](../.github/skills/web-components-assistant/SKILL.md)
- The `data` property is complex (PTOYearReviewResponse), so use private field with getter/setter that calls `requestUpdate()`
- No event handling needed, so no `handleDelegatedClick` override required
- Ensure focus preservation works (BaseComponent handles `id`-based focus automatically)
- Test with the existing `test.html` and `test.ts` files in the component directory

## Questions and Concerns

1.
2.
3.
