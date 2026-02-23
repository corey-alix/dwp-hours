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

  .acknowledge-btn {
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

  .empty-state {
    text-align: center;
    padding: 40px;
    color: var(--color-text-secondary);
  }

  .view-calendar-btn {
    padding: 10px 16px;
    background: transparent;
    color: var(--color-secondary, #6c757d);
    border: 1px solid var(--color-secondary, #6c757d);
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }

  .view-calendar-btn:hover {
    background: var(--color-secondary, #6c757d);
    color: white;
  }

  .toolbar {
    display: flex;
    gap: var(--space-sm, 8px);
    margin-top: var(--space-md, 16px);
    flex-wrap: wrap;
  }

  .employee-card.has-activity {
    border-left: 3px solid var(--color-primary);
  }

  .employee-card.no-activity {
    opacity: 0.7;
  }

  .activity-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .activity-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .activity-dot.active {
    background: var(--color-primary);
  }

  .activity-dot.inactive {
    background: var(--color-text-secondary);
    opacity: 0.4;
  }

  .progress-bar {
    font-size: var(--font-size-sm, 14px);
    color: var(--color-text-secondary);
    margin-bottom: var(--space-md, 16px);
    text-align: center;
  }

  .inline-calendar-container {
    margin-top: var(--space-sm, 8px);
    overflow: hidden;
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-sm, 8px);
    --slide-offset: 16px;
    --duration-normal: 200ms;
  }

  @media (prefers-reduced-motion: reduce) {
    .view-calendar-btn,
    .acknowledge-btn {
      transition: none;
    }
  }

</style>
`;
