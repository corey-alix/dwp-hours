export const styles = `
.months-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-sm);
}

@media (min-width: 480px) {
    .months-grid {
        grid-template-columns: repeat(1, 1fr);
    }
}

@media (min-width: 720px) {
    .months-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 960px) {
    .months-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (min-width: 1200px) {
    .months-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (min-width: 1600px) {
    .months-grid {
        grid-template-columns: repeat(6, 1fr);
    }
}

.month-card {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    overflow: hidden;
    display: grid;
    grid-template-rows: 1fr auto; /* Calendar takes available space, summary docks at bottom */
}

.submit-section {
    text-align: center;
    padding: 16px;
    border-top: 1px solid var(--color-border);
    margin-top: 16px;
    position: sticky;
    bottom: 0;
    background: var(--color-background);
}

.submit-button {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
}

.submit-button:hover {
    background: var(--color-primary-hover);
}

.no-data {
    text-align: center;
    padding: 32px;
    color: var(--color-text-secondary);
}

`;
