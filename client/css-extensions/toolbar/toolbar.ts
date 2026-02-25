/**
 * Toolbar CSS source — single source of truth for toolbar layout utility
 * classes. All spacing references tokens defined in tokens.css via var().
 */
export const toolbarCSS = `
  /* ── Toolbar layout ── */

  .toolbar {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
    align-items: stretch;
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    gap: var(--space-sm, 8px);
  }

  .toolbar > * {
    min-width: 0;
    white-space: normal;
    word-wrap: break-word;
    text-align: center;
  }

  @media (min-width: 768px) {
    .toolbar {
      grid-template-columns: repeat(auto-fit, minmax(120px, auto));
      justify-content: end;
    }
  }

  /* ── Accessibility: respect reduced-motion for any toolbar transitions ── */

  @media (prefers-reduced-motion: reduce) {
    .toolbar {
      transition: none;
    }
  }
`;
