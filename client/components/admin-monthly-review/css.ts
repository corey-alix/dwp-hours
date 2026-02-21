export const styles = `
<style>
  :host {
    display: block;
    padding: 20px;
  }

  .header {
    margin-bottom: 20px;
  }

  .month-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .month-selector label {
    font-weight: 500;
    color: var(--color-text);
  }

  .month-selector input[type="month"] {
    padding: 8px 12px;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-background);
    color: var(--color-text);
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: var(--color-text-secondary);
  }

  .employee-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(24em, 1fr));
    gap: var(--space-md);
  }

  .employee-card {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 20px;
    background: var(--color-surface);
    box-shadow: 0 2px 4px var(--color-shadow);
  }

  .employee-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;
  }

  .employee-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .acknowledgment-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }

  .status-indicator.acknowledged {
    background: var(--color-success, #10b981);
  }

  .status-indicator.pending {
    background: var(--color-warning, #f59e0b);
  }

  .hours-breakdown {
    margin-bottom: 16px;
  }

  .hours-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid var(--color-border-light, #e5e7eb);
  }

  .hours-row:last-child {
    border-bottom: none;
  }

  .hours-label {
    color: var(--color-text-secondary);
  }

  .hours-value {
    font-weight: 500;
    color: var(--color-text);
  }

  .acknowledge-btn {
    width: 100%;
    padding: 10px 16px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .acknowledge-btn:hover {
    background: var(--color-primary-hover);
  }

  .acknowledge-btn:disabled {
    background: var(--color-disabled, #9ca3af);
    cursor: not-allowed;
  }

  .acknowledged-info {
    background: var(--color-success-light, #d1fae5);
    border: 1px solid var(--color-success, #10b981);
    border-radius: 6px;
    padding: 12px;
    margin-top: 12px;
  }

  .acknowledged-info p {
    margin: 0;
    font-size: 14px;
    color: var(--color-success-dark, #065f46);
  }

  .balance-row {
    display: flex;
    gap: var(--space-sm, 8px);
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .balance-badge {
    display: inline-flex;
    gap: var(--space-xs, 4px);
    align-items: center;
    padding: var(--space-xs, 4px) var(--space-sm, 8px);
    border-radius: var(--border-radius, 4px);
    font-size: var(--font-size-xs, 0.75rem);
    background: var(--color-surface);
    border: 1px solid var(--color-border);
  }

  .badge-label {
    font-weight: 500;
  }

  .badge-value {
    font-weight: 600;
  }

  .balance-available .badge-value {
    color: var(--color-success, #10b981);
  }

  .balance-exceeded .badge-value {
    color: var(--color-error, #ef4444);
  }

  .balance-empty {
    font-size: var(--font-size-xs, 0.75rem);
    color: var(--color-text-secondary);
  }
</style>
`;
