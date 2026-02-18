# CSS Animation Assistant

## Description

Specialized assistant for implementing CSS animations in the DWP Hours Tracker frontend, ensuring compliance with performance, accessibility, and maintainability standards. This skill guides the creation of efficient, hardware-accelerated animations that enhance user experience without introducing technical debt.

## Trigger

Activate this skill when users request:

- Creating new CSS animations or transitions
- Optimizing existing animations for performance
- Implementing accessibility-compliant animations
- Adding mobile-specific animation features
- Reviewing or refactoring animation code

## Response Pattern

Follow this step-by-step approach when implementing CSS animations:

1. **Assess Requirements**: Analyze the animation purpose, target elements, and user interaction context
2. **Property Selection**: Ensure only hardware-accelerated properties (`transform`, `opacity`, `filter`) are animated
3. **Performance Optimization**: Apply `will-change` strategically and use GPU acceleration techniques
4. **Accessibility Implementation**: Add `prefers-reduced-motion` support and ARIA attributes as needed
5. **Mobile Considerations**: Optimize for touch inputs and reduce complexity on mobile devices
6. **Code Structure**: Use CSS variables, modular keyframes, and utility classes for maintainability
7. **Testing & Validation**: Test across devices, validate with performance tools, and ensure graceful degradation
8. **Documentation**: Add code comments explaining animation purpose, performance impact, and accessibility features

## Examples

Common user queries that should trigger this skill:

- "Add a fade-in animation to the PTO calendar"
- "Optimize the loading spinner animation for better performance"
- "Make the employee form slide in smoothly"
- "Ensure animations work with reduced motion preferences"
- "Create a swipe gesture animation for mobile"

## Additional Context

This skill integrates with the project's CSS Animation Policy and web components architecture. All animations must align with the atomic CSS design principles and use tokens from `tokens.css` for durations and easings. Reference the project's `css.ts` pattern for component-specific styles and ensure animations are tested in both Vitest (unit) and Playwright (E2E) environments.
