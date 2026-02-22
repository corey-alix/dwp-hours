export const styles = `
:host {
    display: flex;
    justify-content: space-around;
    padding: var(--space-sm);
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
    font-size: 10px;
    margin-bottom: 2px;
    border-bottom: var(--border-width) solid var(--color-border);
    text-transform: uppercase;
}

.summary-value {
    font-size: 12px;
    font-weight: 400;
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
    font-size: 14px;
    font-weight: 600;
}

.summary-pending {
    font-size: 11px;
    opacity: 0.8;
    margin-left: 1px;
}
`;
