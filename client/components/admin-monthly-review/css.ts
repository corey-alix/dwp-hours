export const styles = `
<style>
  :host {
    display: block;
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
    grid-template-columns: repeat(auto-fill, minmax(18em, 1fr));
    gap: var(--space-md);
  }

  .employee-card {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 20px;
    background: var(--color-background);
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
    background: var(--color-success);
  }

  .status-indicator.pending {
    background: var(--color-warning);
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
    background: var(--color-disabled);
    cursor: not-allowed;
  }

  .acknowledged-info {
    text-align: center;
  }

  .acknowledged-info p {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-success-dark);
  }

</style>
`;
