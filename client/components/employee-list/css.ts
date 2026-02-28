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
    padding: var(--space-sm) var(--space-md);
    min-height: 44px;
    min-width: 44px;
    border: var(--border-width) solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-secondary);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-sm);
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

  .action-btn.delete {
    position: relative;
    overflow: hidden;
    -webkit-user-select: none;
    user-select: none;
    touch-action: none;
  }

  .action-btn.delete::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--color-error);
    transform: scaleX(0);
    transform-origin: left;
    pointer-events: none;
    z-index: 0;
  }

  .action-btn.delete.pressing::after {
    animation: delete-fill 1.5s linear forwards;
  }

  .action-btn.delete.pressing {
    color: var(--color-on-error);
  }

  @keyframes delete-fill {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .action-btn,
    .employee-card {
      transition: none;
    }

    .action-btn.delete.pressing::after {
      animation: none;
      transform: scaleX(1);
      opacity: 0;
      animation: delete-fill-reduced 1.5s linear forwards;
    }
  }

  @keyframes delete-fill-reduced {
    from { opacity: 0; }
    to   { opacity: 1; transform: scaleX(1); }
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

  .view-calendar-btn {
    background: transparent;
    color: var(--color-secondary, #6c757d);
    border-color: var(--color-secondary, #6c757d);
  }

  .view-calendar-btn:hover {
    background: var(--color-secondary, #6c757d);
    color: white;
  }

  .inline-calendar-container {
    margin-top: var(--space-sm);
    overflow: hidden;
    border-top: var(--border-width) solid var(--color-border);
    padding-top: var(--space-sm);
    --slide-offset: 16px;
    --duration-normal: 200ms;
  }

  @media (prefers-reduced-motion: reduce) {
    .view-calendar-btn {
      transition: none;
    }
  }
</style>`;
