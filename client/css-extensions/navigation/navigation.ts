/**
 * Navigation CSS source — single source of truth for navigation arrow
 * button styles and shared navigation symbols.
 *
 * Components importing these resources ensure consistent navigation UX
 * across the application, avoiding hard-coded arrow characters.
 */

/** Unicode arrow symbols for navigation buttons */
export const NAV_SYMBOLS = {
  PREV: "←",
  NEXT: "→",
} as const;

export const navigationCSS = `
  /* ── Navigation arrow buttons ── */

  .nav-arrow {
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--font-size-xl, 1.25rem);
    color: var(--color-text);
    padding: var(--space-xs, 4px);
    border-radius: var(--border-radius-sm, 4px);
    transition: background-color var(--duration-fast, 0.15s) var(--easing-standard, ease);
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-arrow:hover {
    background: var(--color-surface-hover, rgb(0 0 0 / 5%));
  }

  .nav-arrow:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ── Navigation header (arrows + label) ── */

  .nav-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-xs, 4px) 0;
  }

  .nav-header .nav-label {
    font-weight: 600;
    font-size: var(--font-size-md, 1rem);
    color: var(--color-text);
    text-align: center;
    flex: 1;
  }

  /* ── Accessibility: respect reduced-motion ── */

  @media (prefers-reduced-motion: reduce) {
    .nav-arrow {
      transition: none;
    }
  }
`;
