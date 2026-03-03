/**
 * Styles for <prior-year-review> component.
 * Uses design tokens from tokens.css.
 * Mobile-first: single column by default, multi-column at 768px+.
 * PTO type colors are adopted via the pto-day-colors CSS extension.
 */
export const styles = `<style>
  .container {
    padding: var(--space-md, 16px);
  }

  .no-data {
    text-align: center;
    padding: var(--space-xl, 32px);
    color: var(--color-text-secondary);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm, 8px) var(--space-md, 16px);
    margin-bottom: var(--space-md, 16px);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: var(--space-xs, 4px);
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--color-text-secondary);
  }

  .legend-swatch {
    display: inline-block;
    width: var(--space-md, 16px);
    height: var(--space-md, 16px);
    border-radius: var(--border-radius-sm, 2px);
  }

  .months-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-md, 16px);
    max-width: 1540px;
    margin: 0 auto;
  }

  .month-card {
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg, 8px);
    background: var(--color-surface);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .month-card pto-calendar {
    flex: 1;
  }

  .month-card month-summary {
    border-top: 1px solid var(--color-border);
  }

  @media (min-width: 768px) {
    .months-grid {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
  }

  /* Print layout (colors handled by token reset in media.css) */
  @media print {
    .container {
      padding: 0;
    }

    .months-grid {
      grid-template-columns: repeat(4, 1fr) !important;
      gap: 2pt !important;
      max-width: none !important;
      margin: 0 !important;
    }

    .month-card {
      border-radius: 0;
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
</style>`;
