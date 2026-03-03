export const styles = `<style>
  :host {
    display: block;
    padding: var(--space-md, 16px);
    padding-bottom: var(--space-lg);
  }

  .page-heading {
    text-align: center;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin: var(--space-md) 0 var(--space-sm) 0;
  }

  .year-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--space-md, 16px);
    margin-bottom: var(--space-sm, 8px);
  }

  .year-nav-btn {
    display: inline-flex;
    align-items: center;
    padding: var(--space-xs, 4px) var(--space-sm, 8px);
    border: 1px solid var(--color-border, #ccc);
    border-radius: var(--radius-sm, 4px);
    background: var(--color-surface, #fff);
    color: var(--color-primary, #0066cc);
    font-size: var(--font-size-sm, 14px);
    font-weight: var(--font-weight-medium, 500);
    text-decoration: none;
    cursor: pointer;
    transition: background 200ms ease, color 200ms ease;
  }

  .year-nav-btn:hover:not(.disabled) {
    background: var(--color-surface-hover, #f0f0f0);
  }

  .year-nav-btn:focus-visible {
    outline: 2px solid var(--color-primary, #0066cc);
    outline-offset: 2px;
  }

  .year-nav-btn.disabled {
    opacity: 0.35;
    cursor: default;
    pointer-events: none;
  }

  .year-nav-current {
    font-size: var(--font-size-lg, 18px);
    font-weight: var(--font-weight-bold, 700);
    color: var(--color-text);
    min-width: 3em;
    text-align: center;
  }

  .sticky-balance {
    position: sticky;
    top: 56px;
    z-index: 1;
    background: var(--color-background);
    margin-bottom: var(--space-sm);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-md, 16px);
    justify-content: center;
    margin-bottom: var(--space-md, 16px);
    padding: var(--space-sm, 8px);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md, 4px);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs, 4px);
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--color-text-secondary);
  }

  .legend-swatch {
    width: 16px;
    height: 16px;
    border-radius: var(--border-radius-sm, 2px);
    border: 1px solid var(--color-border);
  }

  .pto-type-pto {
    background: var(--color-pto);
  }

  .pto-type-sick {
    background: var(--color-pto-sick);
  }

  .pto-type-bereavement {
    background: var(--color-pto-bereavement);
  }

  .pto-type-jury-duty {
    background: var(--color-pto-jury-duty);
  }

  @media (prefers-reduced-motion: reduce) {
    .year-nav-btn {
      transition: none;
    }
  }

  /* Print layout (colors handled by token reset in media.css) */
  @media print {
    :host {
      padding: 0;
    }

    .page-heading {
      font-size: 10pt;
      margin: 0 0 2pt 0;
      page-break-after: avoid;
    }

    .year-nav {
      display: none;
    }

    .sticky-balance {
      position: static;
      margin-bottom: 2pt;
      page-break-inside: avoid;
    }

    .legend {
      margin-bottom: 2pt;
      padding: 2pt 4pt;
      page-break-inside: avoid;
    }

    .legend-item {
      font-size: 6pt;
    }

    .legend-swatch {
      width: 8pt;
      height: 8pt;
    }
  }
</style>`;
