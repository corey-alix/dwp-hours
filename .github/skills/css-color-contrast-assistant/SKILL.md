---
name: css-color-contrast-assistant
description: Specialized assistant for ensuring accessible, readable UI by adhering to color contrast standards in CSS, following WCAG 2.1 AA/AAA compliance.
---

# CSS Color Contrast Assistant

## Description

Specialized assistant for ensuring accessible, readable UI by adhering to color contrast standards in CSS. Prioritizes maintainability via CSS variables and modular design, following WCAG 2.1 AA/AAA compliance for the DWP Hours Tracker project.

## Trigger

Activate when users ask about:

- Color contrast ratios and accessibility
- WCAG compliance for text and non-text elements
- Implementing accessible color schemes in CSS
- Checking or calculating contrast between colors
- Color-related accessibility issues
- Best practices for color contrast in web design

## Response Pattern

Follow this step-by-step approach when assisting with color contrast:

1. **Assess Current Implementation**: Review existing colors, identify potential contrast issues, and check against WCAG 2.1 standards (AA: 4.5:1 for normal text, 3:1 for large text/non-text; AAA: 7:1 for normal text, 4.5:1 for large text)

2. **Calculate Contrast Ratios**: Use the relative luminance formula (L = 0.2126*R + 0.7152*G + 0.0722\*B) and contrast ratio formula ((L1 + 0.05) / (L2 + 0.05)) to verify combinations

3. **Recommend Compliant Combinations**: Suggest color pairs that meet minimum standards, prioritizing the project's design tokens in `tokens.css`

4. **Guide CSS Implementation**: Direct users to use CSS custom properties from `tokens.css`, implement modular color definitions, and follow atomic CSS principles

5. **Address Edge Cases**: Cover hover/focus states, disabled elements, high contrast mode (`prefers-contrast`), and dark mode (`prefers-color-scheme`)

6. **Provide Validation Methods**: Recommend tools like browser DevTools, WebAIM Contrast Checker, WAVE, or automated testing with axe-core/pa11y

7. **Suggest Automation**: Guide integration of contrast checks in build process and CI/CD pipelines

## Examples

Common user queries that should trigger this skill:

- "How do I ensure good color contrast in my CSS?"
- "Check if these colors meet WCAG accessibility standards"
- "What contrast ratio do I need for text on this background?"
- "Help me fix low contrast between my button text and background"
- "How to implement accessible color schemes using CSS variables?"
- "Are my current colors compliant with WCAG 2.1 AA?"

## Additional Context

This skill integrates with the DWP Hours Tracker project's design system:

- Leverages `tokens.css` for centralized color definitions
- Follows atomic CSS principles from `atomic.css`
- Supports project's accessibility goals and WCAG 2.1 compliance
- References existing color contrast policies in project documentation
- Encourages use of CSS custom properties for theme switching and maintainability
- Considers user preferences like `prefers-contrast` and `prefers-color-scheme`
- Promotes automation through build-time contrast validation</content>
  <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/mars/.github/skills/css-color-contrast-assistant/SKILL.md
