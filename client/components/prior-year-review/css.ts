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
  }

  .month-header {
    font-weight: var(--font-weight-semibold, 600);
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    background: var(--color-surface-hover);
    border-bottom: 1px solid var(--color-border);
    text-align: center;
  }

  .month-calendar {
    padding: var(--space-sm, 8px);
  }

  .calendar-header {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: var(--space-xs, 4px);
  }

  .weekday {
    font-size: var(--font-size-xs, 0.75rem);
    font-weight: var(--font-weight-semibold, 600);
    color: var(--color-text-secondary);
    text-align: center;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  .day {
    position: relative;
    aspect-ratio: 1;
    border-radius: var(--border-radius-md, 4px);
    background: var(--color-surface);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xs, 0.75rem);
    min-height: 24px;
  }

  .day.empty {
    opacity: 0;
    border: none;
  }

  .day .date {
    font-weight: var(--font-weight-semibold, 600);
    color: var(--color-text);
  }

  .day .hours {
    position: absolute;
    bottom: 1px;
    right: 2px;
    font-size: 0.5rem;
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-semibold, 600);
  }

  @media (min-width: 768px) {
    .months-grid {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
  }
</style>`;
