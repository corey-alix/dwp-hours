export const styles = `
:host {
  display: block;
  container-type: inline-size;
}

.card {
  background: var(--color-background);
  border: var(--border-width) var(--border-style-solid) var(--color-border);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-sm);
}

.accrual-heading {
  text-align: center;
  background: var(--color-surface);
  padding: var(--space-sm);
  margin: 0 0 var(--space-md) 0;
  font-size: var(--font-size-xl);
  border-bottom: var(--border-width) var(--border-style-solid) var(--color-border);
  color: var(--color-text);
  font-weight: var(--font-weight-semibold);
}

.accrual-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0;
  font-size: var(--font-size-sm);
  overflow: hidden;
}

.cell {
  padding: var(--space-xs) var(--space-sm);
  border-bottom: var(--border-width) var(--border-style-solid) var(--color-border-light);
}

.cell:not(:last-child) {
  border-right: var(--border-width) var(--border-style-solid) var(--color-border-light);
}

/* Header row */

.cell.header {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  background: var(--color-surface);
  text-align: center;
}

/* Month label column */

.cell.month-label {
  text-align: left;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Numeric columns */

.cell.numeric {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Alternating row stripes */

.accrual-grid .row:nth-child(odd) .cell {
  background: var(--color-surface);
}

/* Current month highlight */

.row.current-month .cell {
  font-weight: var(--font-weight-semibold);
  background: var(--color-info-light);
}

/* Last row has no bottom border */

.accrual-grid .row:last-child .cell {
  border-bottom: none;
}

/* Compact-only columns — hidden at very narrow widths */

.compact-only {
  display: none;
}

/* Wide-only columns — hidden by default */

.wide-only {
  display: none;
}

/* Compact layout via container query */

@container (inline-size >= 360px) {
  .accrual-grid {
    grid-template-columns: 1fr repeat(3, auto);
  }

  .compact-only {
    display: block;
  }
}

/* Wide layout via container query */

@container (inline-size >= 540px) {
  .accrual-grid {
    grid-template-columns: 1fr repeat(6, auto);
  }

  .wide-only {
    display: block;
  }
}

/* Negative balance styling */

.cell.negative {
  color: var(--color-warning);
}

/* Totals row */

.totals-row .cell {
  font-weight: var(--font-weight-semibold);
  border-top: calc(var(--border-width) * 2) var(--border-style-solid) var(--color-border);
  background: var(--color-surface);
}

/* Rows use subgrid to align with parent grid */

.row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}

.header-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}
`;
