export const styles = `
<style>
  :host {
    display: block;
  }

  .header {
    margin-bottom: 20px;
  }

  .review-heading {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 20px;
    text-align: center;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: var(--color-text-secondary);
  }

  .employee-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(40ch, 100%), 1fr));
    gap: var(--space-md);
  }

  .employee-card {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 20px;
    background: var(--color-background);
    box-shadow: 0 2px 4px var(--color-shadow);
    overflow: hidden;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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

  .acknowledge-btn.confirming {
    background: var(--color-warning);
    color: var(--color-on-warning, #000);
    outline: 2px solid var(--color-warning);
    outline-offset: 1px;
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

  /* Lock status pill badges — cross-platform safe, no emoji. */
  .lock-indicator {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    user-select: none;
    flex-shrink: 0;
    white-space: nowrap;
    transition: transform 0.2s ease;
  }

  .lock-indicator.locked {
    background: rgb(34 197 94 / 12%);
    color: var(--color-success-dark, #166534);
  }

  .lock-indicator.unlocked {
    background: rgb(245 158 11 / 15%);
    color: var(--color-warning-dark, #92400e);
    cursor: pointer;
  }

  .lock-indicator.unlocked:hover {
    transform: scale(1.05);
  }

  .lock-indicator.notified {
    background: rgb(59 130 246 / 12%);
    color: var(--color-info-dark, #1e40af);
    cursor: default;
  }

  .lock-indicator.notified-read {
    background: rgb(107 114 128 / 12%);
    color: var(--color-text-secondary);
    cursor: pointer;
  }

  .lock-indicator.notified-read:hover {
    transform: scale(1.05);
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
    /* Isolate touch: allow vertical scroll only; horizontal is handled by JS swipe */
    touch-action: pan-y;
    overscroll-behavior: contain;
  }

  @media (prefers-reduced-motion: reduce) {
    .view-calendar-btn,
    .acknowledge-btn {
      transition: none;
    }

    .lock-indicator {
      transition: none;
    }
  }

</style>
`;
