---
name: atomic-css
description: Specialized assistant for implementing and maintaining atomic CSS utilities in the DWP Hours Tracker frontend.
---

# Atomic CSS

## Description

Specialized assistant for implementing and maintaining atomic CSS utilities in the DWP Hours Tracker frontend, following Tailwind-like conventions with token-based CSS custom properties for maintainable, consistent styling.

## Naming Conventions

When creating new atomic CSS utilities, follow the Tailwind CSS naming conventions as documented at https://tailwind.build/classes. Key patterns include:

- **Layout**:
  - Display: `block`, `inline`, `flex`, `grid`, `hidden`
  - Position: `static`, `relative`, `absolute`, `fixed`
  - Flexbox: `flex`, `flex-row`, `flex-col`, `justify-start`, `justify-center`, `justify-end`, `justify-between`, `items-start`, `items-center`, `items-end`, `flex-1`, `flex-auto`
  - Grid: `grid`, `grid-cols-1` to `grid-cols-12`, `grid-rows-*`, `gap-0` to `gap-16`, `col-span-*`, `row-span-*`

- **Spacing**:
  - Padding: `p-0` to `p-16` for all sides, `px-*`/`py-*` for horizontal/vertical, `pt-*`/`pr-*`/`pb-*`/`pl-*` for individual sides
  - Margin: Same pattern as padding with `m-*`, `mx-*`, `my-*`, `mt-*`, `mr-*`, `mb-*`, `ml-*`

- **Colors**: `bg-*`, `text-*`, `border-*` using token-based names like `bg-color-surface`, `text-color-on-surface`, `border-color-outline`

- **Typography**:
  - Text size: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl` up to `text-9xl`
  - Font weight: `font-thin`, `font-light`, `font-normal`, `font-medium`, `font-semibold`, `font-bold`, `font-extrabold`, `font-black`
  - Line height: `leading-none`, `leading-tight`, `leading-snug`, `leading-normal`, `leading-relaxed`, `leading-loose`
  - Text alignment: `text-left`, `text-center`, `text-right`, `text-justify`

- **Borders**: `border`, `border-*` (width), `border-t`, `border-r`, `border-b`, `border-l`, `rounded`, `rounded-*` (sm, md, lg, xl, full), `border-solid`, `border-dashed`, `border-dotted`

- **Effects**: `shadow`, `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-xl`, `opacity-0` to `opacity-100`

Use kebab-case for multi-word tokens and maintain consistency with existing utilities.

## Trigger

Activate when users need to:

- Create new atomic CSS utility classes (background, border, padding, margin, etc.)
- Apply Tailwind-like styling to web components
- Integrate token-based colors and spacing from tokens.css
- Maintain and extend the atomic.css file
- Style components with utility-first approach

## Response Pattern

1. Analyze the styling requirement and identify which utilities are needed (background, border, padding, etc.)
2. Check existing utilities in client/atomic.css to avoid duplication
3. Define new utilities using CSS custom properties (--color-_, --space-_, etc.) from tokens.css
4. Follow the naming conventions outlined in the Naming Conventions section (e.g., bg-color-surface, p-4, rounded-lg)
5. Apply utilities to HTML elements using class attributes in index.html
6. Test styling in browser and ensure responsiveness and accessibility
7. Update documentation if new patterns are established

## Examples

- "Add background color utility for surface using tokens"
- "Create padding utility classes for card spacing"
- "Style the PTO employee info card with Tailwind-like classes"
- "Implement border radius utilities for components"
- "Add margin utilities for layout spacing"

## Additional Context

- Integrates with tokens.css for consistent theming and design system compliance
- Utilities follow Tailwind CSS naming conventions for familiarity
- Works alongside web-components-assistant for component-specific styling
- Maintains atomic design principles: single-purpose, reusable classes
- Supports responsive design through utility combinations
- Located in client/atomic.css file</content>
  <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/mars/.github/skills/atomic-css/SKILL.md
