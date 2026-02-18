/**
 * Shared CSS for all PTO card components.
 * Single source of truth — replaces both PTO_CARD_CSS and renderCard() inline styles.
 */
export const CARD_CSS = `
    :host {
        display: block;
    }

    @media all {
    .card {
        padding: var(--space-lg);
        }
    }

    @media (min-width: 360px) {
    .card {
        padding: var(--space-sm);
        }
    }

    .card {
        background: var(--color-background);
        border: var(--border-width) var(--border-style-solid) var(--color-border);
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-md);
    }

    .card h4 {
        margin: 0 0 var(--space-md) 0;
        font-size: var(--font-size-lg);
        color: var(--color-text);
        font-weight: var(--font-weight-semibold);
    }

    .card .row {
        display: flex;
        justify-content: space-between;
        gap: var(--space-lg);
        margin: var(--space-xs) 0;
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
    }

    .card .row:last-child {
        margin-bottom: var(--space-md);
    }

    .card .label {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text);
    }

    .card .label.approved::after {
        content: " ✓";
        color: var(--color-success);
        font-weight: var(--font-weight-semibold);
    }

    .card .usage-date.approved::after {
        content: " ✓";
        color: var(--color-success);
        font-weight: var(--font-weight-semibold);
    }

    .card .negative-balance {
        color: var(--color-error);
        font-weight: var(--font-weight-semibold);
    }

    .toggle-button {
        background: var(--color-primary);
        color: black;
        border: none;
        border-radius: var(--border-radius-md);
        padding: var(--space-sm) var(--space-md);
        font-size: var(--font-size-sm);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        transition: background-color var(--transition-fast);
        margin: var(--space-md) 0;
        width: 100%;
        justify-content: center;
    }

    .toggle-button:hover {
        background: var(--color-primary-hover);
    }

    .toggle-button:focus {
        outline: 2px solid var(--color-focus);
        outline-offset: 2px;
    }

    .chevron {
        transition: transform var(--transition-fast);
    }

    .chevron.expanded {
        transform: rotate(180deg);
    }

    .usage-section {
        margin-top: var(--space-md);
        padding-top: var(--space-md);
        border-top: 1px solid var(--color-border);
    }

    .usage-title {
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-text-secondary);
        margin-bottom: var(--space-sm);
    }

    .usage-help {
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-normal);
        color: var(--color-text-muted);
        font-style: italic;
    }

    .usage-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .usage-list li {
        display: flex;
        justify-content: space-between;
        padding: var(--space-xs) 0;
        font-size: var(--font-size-sm);
        border-bottom: 1px solid var(--color-border-light);
    }

    .usage-list li:last-child {
        border-bottom: none;
    }

    .usage-date {
        cursor: pointer;
        text-decoration: underline;
        color: var(--color-primary);
        transition: background-color var(--transition-fast);
        padding: var(--space-xs);
        border-radius: var(--border-radius-sm);
        margin: calc(var(--space-xs) * -1);
    }

    .usage-date:hover {
        background: var(--color-surface-hover);
    }

    .usage-date:focus {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
    }

    .empty {
        font-size: var(--font-size-sm);
        color: var(--color-text-secondary);
        font-style: italic;
    }

    @media (max-width: 280px) {
        .usage-list li {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-xs);
        }

        .usage-list li span:first-child {
            font-weight: var(--font-weight-medium);
        }
    }
`;
