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
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .employee-grid {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-md);
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  @media (min-width: 768px) {
    .employee-grid {
      grid-template-columns: repeat(auto-fill, minmax(18em, 1fr));
    }
  }

  .employee-card {
    background: var(--color-background);
    border-radius: var(--border-radius-lg);
    padding: var(--space-md);
    box-shadow: var(--shadow-md);
    border: var(--border-width) solid var(--color-border);
    transition: box-shadow 0.3s ease;
  }

  .employee-card:hover {
    box-shadow: var(--shadow-lg);
  }

  .employee-identifier {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    margin: 0;
  }

  .card-header {
    display: flex;
    justify-content: flex-end;
    margin-bottom: var(--space-sm);
  }

  .employee-role {
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--border-radius-xl);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
  }

  .employee-role.role-admin {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }

  .employee-role.role-employee {
    background: var(--color-surface);
    color: var(--color-text-secondary);
    border: var(--border-width) solid var(--color-border);
  }

  .employee-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--space-sm);
    margin-bottom: var(--space-sm);
  }

  .detail-item {
    display: flex;
    flex-direction: column;
  }

  .detail-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.025em;
    margin-bottom: var(--space-xs);
  }

  .detail-value {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
  }

  .employee-actions {
    display: flex;
    gap: var(--space-xs);
    justify-content: flex-end;
  }

  .action-btn {
    padding: var(--space-xs) var(--space-sm);
    border: var(--border-width) solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-xs);
    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
  }

  .action-btn:hover {
    background: var(--color-surface-hover);
    border-color: var(--color-border-hover);
  }

  .action-btn.delete {
    border-color: var(--color-error);
    color: var(--color-error);
  }

  .action-btn.delete:hover {
    background: var(--color-error);
    color: var(--color-on-error);
  }

  @media (prefers-reduced-motion: reduce) {
    .action-btn,
    .employee-card {
      transition: none;
    }
  }

  .empty-state {
    text-align: center;
    padding: var(--space-2xl);
    color: var(--color-text-secondary);
    grid-column: 1 / -1;
  }

  .empty-state h3 {
    margin: 0 0 var(--space-sm) 0;
    font-size: var(--font-size-lg);
    color: var(--color-text);
  }

  .inline-editor {
    background: var(--color-surface);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    border: var(--border-width) solid var(--color-border);
    grid-column: 1 / -1;
  }
</style>`;
