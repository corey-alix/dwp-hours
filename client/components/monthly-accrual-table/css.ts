export const styles = `
:host {
  display: block;
  container-type: inline-size;
}

.accrual-heading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text);
  margin: var(--space-md) 0 var(--space-sm) 0;
}

.accrual-grid {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0;
  font-size: var(--font-size-sm);
  border: var(--border-width) var(--border-style-solid) var(--color-border);
  border-radius: var(--border-radius-md);
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
  font-weight: var(--font-weight-normal);
  color: var(--color-text);
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
