export const styles = `<style>
  :host {
    display: block;
    height: 100%;
  }

  pto-balance-summary {
    margin: 0 0 var(--space-md) 0;
  }

  pto-balance-summary .balance-row {
    justify-content: center;
  }

  .employee-list {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .toolbar {
    display: flex;
    gap: var(--space-md);
  }

  .search-container {
    display: grid;
    gap: var(--space-sm);
    grid-template-columns: 3fr 1fr;
    align-items: center;
  }

  .search-input {
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-md);
    background: var(--color-background);
    color: var(--color-text);
  }

  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }

  .search-container span {
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .action-buttons {
    display: flex;
    gap: 10px;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s ease;
  }

  .btn-primary {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }

  .btn-primary:hover {
    background: var(--color-primary-hover);
  }

  .employee-grid {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-md);
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18em, 1fr));
    gap: var(--space-md);
  }

  .employee-card {
    background: var(--color-surface);
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 4px var(--color-shadow);
    border: 1px solid var(--color-border);
    transition: box-shadow 0.3s ease;
  }

  .employee-card:hover {
    box-shadow: 0 4px 8px var(--color-shadow-dark);
  }

  .employee-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .employee-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }

  .employee-identifier {
    color: var(--color-text-secondary);
    font-size: 14px;
    margin: 0;
  }

  .employee-role {
    background: var(--color-primary);
    color: var(--color-on-primary);
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .employee-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
  }

  .detail-label {
    font-size: 12px;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .detail-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
  }

  .employee-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .action-btn {
    padding: 6px 12px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s ease;
  }

  .action-btn:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-border-hover);
  }

  .action-btn.acknowledge {
    border-color: var(--color-success);
    color: var(--color-success);
  }

  .action-btn.acknowledge:hover {
    background: var(--color-success);
    color: var(--color-on-success);
  }

  .action-btn.delete {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .action-btn.delete:hover {
    background: var(--color-error);
    color: var(--color-on-error);
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: var(--color-text-secondary);
    grid-column: 1 / -1;
  }

  .empty-state h3 {
    margin: 0 0 10px;
    font-size: 18px;
    color: var(--color-text);
  }

  .inline-editor {
    background: var(--color-surface);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--color-shadow);
    border: 1px solid var(--color-border);
    grid-column: 1 / -1;
  }
</style>`;
