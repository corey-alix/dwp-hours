export const styles = `
:host {
    display: block;
}

.balance-grid {
    display: grid;
    grid-template-columns: auto repeat(3, 1fr);
    gap: 0;
    font-size: var(--font-size-sm);
    border: var(--border-width) var(--border-style-solid) var(--color-border);
    border-radius: var(--border-radius-md);
    overflow: hidden;
}

.cell {
    padding: var(--space-xs) var(--space-sm);
    text-align: right;
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

/* Row label column */

.cell.row-label {
    text-align: left;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: var(--color-surface);
}

/* Last row has no bottom border */

.balance-grid .cell:nth-last-child(-n+4) {
    border-bottom: none;
}

/* Negative balance styling */

.cell.negative {
    color: var(--color-warning);
    font-weight: var(--font-weight-semibold);
}

/* Column type colors for header text */

.cell.col-pto {
    color: var(--color-pto-vacation);
}

.cell.col-sick {
    color: var(--color-pto-sick);
}

.cell.col-other {
    color: var(--color-text-secondary);
}

/* Avail row emphasis */

.cell.row-avail {
    font-weight: var(--font-weight-semibold);
}
`;
