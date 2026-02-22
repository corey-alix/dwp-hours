export const styles = `
:host {
    display: flex;
    justify-content: space-around;
    gap: var(--space-sm);
    background: var(--color-background);
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}

.summary-item {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.summary-label {
    font-size: var(--font-size-xs);
    margin-bottom: var(--space-xs);
    border-bottom: var(--border-width) solid var(--color-border);
    text-transform: uppercase;
}

.summary-value {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-normal);
}

/* Color consistency: summary values match calendar day colors */

.summary-pto { color: var(--color-pto-vacation); }

.summary-sick { color: var(--color-pto-sick); }

.summary-bereavement { color: var(--color-pto-bereavement); }

.summary-jury-duty { color: var(--color-pto-jury-duty); }

/* Visual hierarchy: larger font for non-zero values */

.summary-pto,
.summary-sick,
.summary-bereavement,
.summary-jury-duty {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
}

.summary-pending {
    font-size: var(--font-size-xs);
    opacity: 0.8;
    margin-left: var(--space-xs);
}

/* Interactive mode: clickable labels for PTO type selection */

.summary-item.interactive {
    cursor: pointer;
    user-select: none;
    transition: opacity var(--duration-fast, 150ms) var(--easing-standard);
}

.summary-item.interactive:hover {
    opacity: 0.7;
}

/* Active PTO type indicator: green checkmark + bolder label */

.summary-item.active .summary-label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold, 700);
    border-bottom-color: currentColor;
}

.summary-item.active .summary-label::after {
    content: "✓";
    color: var(--color-success);
    margin-left: var(--space-xs);
    font-weight: var(--font-weight-bold, 700);
}

/* Balance mode: override type color with remaining-status color */

.summary-value.balance-positive {
    color: var(--color-success);
}

.summary-value.balance-negative {
    color: var(--color-warning);
}

@media (prefers-reduced-motion: reduce) {

    .summary-item.interactive {
        transition: none;
    }
}
`;
