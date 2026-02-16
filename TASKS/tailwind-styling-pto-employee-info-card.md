# Tailwind Styling for PTO Employee Info Card

## Description

Implement Tailwind-compatible CSS utilities for styling the <pto-employee-info-card> component, using token-defined :root colors for background, with appropriate border radius and padding. Ensure the syntax and naming conventions align with Tailwind CSS for maintainability and consistency.

## Priority

🟢 Low Priority

## Checklist

- [ ] Define or verify token-based :root color variables in tokens.css for card backgrounds
- [ ] Create custom Tailwind utility classes for background color (using arbitrary values if needed, e.g., bg-[var(--color-token)])
- [ ] Implement Tailwind classes for border radius (e.g., rounded-lg) and padding (e.g., p-4)
- [ ] Apply the utility classes to the <pto-employee-info-card> element in index.html
- [ ] Test the styling in the browser to ensure proper rendering and responsiveness
- [ ] Ensure compatibility with existing CSS and component styles
- [ ] Update any relevant documentation for custom utilities
- [ ] Pass code quality gates: build, lint, manual testing

## Implementation Notes

- Use CSS custom properties (--color-token) defined in :root for colors to maintain consistency with the project's token system.
- Leverage Tailwind's arbitrary value syntax (e.g., bg-[var(--primary-bg)]) for token integration.
- Follow Tailwind naming conventions for any new utilities.
- Ensure the styling is responsive and accessible.

### Suggested CSS Class Names

- **Background Color**: `bg-color-surface` - Custom Tailwind utility class that references the semantic surface color token.
- **Border Radius**: `rounded-lg` - Matches the token --border-radius-lg (8px) for consistent corner rounding.
- **Padding**: `p-4` - Standard padding using Tailwind's spacing scale (16px), aligning with --space-md token.

### Example Usage

First, define the custom utility in your CSS (e.g., in `client/atomic.css` or a dedicated atomic utilities file):

```css
.bg-color-surface {
  background-color: var(--color-surface);
}
```

Then apply the classes to the `<pto-employee-info-card>` element in `index.html`:

```html
<pto-employee-info-card
  class="bg-color-surface rounded-lg p-4"
></pto-employee-info-card>
```

This approach uses a custom atomic CSS class for cleaner syntax without inline var() references.

## Questions and Concerns

1.
2.
3.
