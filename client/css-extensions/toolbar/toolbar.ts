/**
 * Toolbar CSS source — single source of truth for toolbar layout utility
 * classes. All spacing references tokens defined in tokens.css via var().
 */
export const toolbarCSS = `
  /* ── Toolbar layout ── */

  .toolbar {
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    gap: var(--space-sm, 8px);
  }

  /* ── Accessibility: respect reduced-motion for any toolbar transitions ── */

  @media (prefers-reduced-motion: reduce) {
    .toolbar {
      transition: none;
    }
  }
`;
