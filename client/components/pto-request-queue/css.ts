export const styles = `<style>
  :host {
    display: block;
    height: 100%;
  }

  .queue-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .queue-header {
    display: flex;
    justify-content: space-between;
    gap: var(--space-header);
    align-items: center;
    padding: var(--space-lg);
    border-bottom: 1px solid var(--color-border);
    background: var(--color-surface);
  }

  .queue-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin: 0;
  }

  .queue-stats {
    display: flex;
    gap: var(--space-lg);
    align-items: center;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .stat-value {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
  }

  .stat-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .queue-content {
    gap: var(--space-header);
    display: grid;
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  @media (min-width: 768px) {

    .queue-content {
      grid-template-columns: repeat(auto-fit, minmax(24em, 1fr));
    }
  }

  .employee-group {
    grid-column: 1 / -1;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--space-md);
    background: var(--color-surface);
  }

  .employee-group-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-md);
    margin-bottom: var(--space-md);
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--color-border);
  }

  .employee-group-name {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin: 0;
    flex: 1 1 auto;
  }

  .employee-group-cards {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }

  @media (min-width: 768px) {

    .employee-group-cards {
      grid-template-columns: repeat(auto-fit, minmax(20em, 1fr));
    }
  }

  .request-card {
    background: var(--color-background);
    border-radius: var(--border-radius-lg);
    padding: var(--space-lg);
    margin-bottom: var(--space-md);
    box-shadow: var(--shadow-md);
    border: 1px solid var(--color-border);
    transition: box-shadow 0.3s ease;
  }

  .request-card:hover {
    box-shadow: var(--shadow-lg);
  }

  .request-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-md);
  }

  .employee-info {
    display: flex;
    flex-direction: column;
  }

  .employee-name {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--color-text);
    margin: 0;
  }

  .request-type {
    background: var(--color-primary);
    color: var(--color-on-primary);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--border-radius-xl);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-medium);
    margin-top: var(--space-xs);
    display: inline-block;
  }

  .request-type.Sick { background: var(--color-pto-sick); }

  .request-type.PTO { background: var(--color-pto-vacation); }

  .request-type.Bereavement { background: var(--color-pto-bereavement); }

  .request-type.Jury-Duty { background: var(--color-pto-jury-duty); }

  .request-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: var(--space-md);
    margin-bottom: var(--space-md);
  }

  .detail-item {
    display: flex;
    flex-direction: column;
  }

  .detail-label {
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--space-xs);
  }

  .detail-value {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
  }

  .request-dates {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .date-range {
    background: var(--color-surface);
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--border-radius);
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
  }

  .request-actions {
    display: flex;
    gap: var(--space-md);
    justify-content: flex-end;
  }

  .action-btn {
    padding: var(--space-sm) var(--space-lg);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: opacity 0.3s ease, background-color 0.3s ease;
  }

  .action-btn.approve {
    background: var(--color-success);
    color: var(--color-on-success);
  }

  .action-btn.approve:hover {
    background: var(--color-success);
    opacity: 0.8;
  }

  .action-btn.reject {
    background: var(--color-error);
    color: var(--color-on-error);
  }

  .action-btn.reject:hover {
    background: var(--color-error);
    opacity: 0.8;
  }

  .action-btn.confirming {
    outline: 2px solid var(--color-warning);
    outline-offset: 1px;
  }

  .action-btn.approve.confirming {
    background: var(--color-warning);
    color: var(--color-on-warning, #000);
  }

  .action-btn.reject.confirming {
    background: var(--color-warning);
    color: var(--color-on-warning, #000);
  }

  .empty-state {
    text-align: center;
    padding: calc(var(--space-2xl) * 1.5) var(--space-xl);
    color: var(--color-text-muted);
  }

  .empty-state h3 {
    margin: 0 0 var(--space-sm);
    font-size: var(--font-size-xl);
    color: var(--color-text);
  }

  .empty-state p {
    margin: 0;
    font-size: var(--font-size-base);
  }

  .status-badge {
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--border-radius-xl);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-badge.pending {
    background: var(--color-warning-light);
    color: var(--color-warning);
  }

  @media (prefers-reduced-motion: reduce) {

    .request-card {
      transition: none;
    }

    .action-btn {
      transition: none;
    }
  }
</style>`;
