export const styles = `<style>
  :host {
    display: block;
    padding: var(--space-md, 16px);
  }

  month-summary {
    position: sticky;
    top: 80px;
    z-index: 1;
    background: var(--color-surface);
  }

  pto-entry-form {
    margin-top: 40px;
  }

  .btn {
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border: none;
    border-radius: var(--border-radius, 4px);
    cursor: pointer;
    font-size: var(--font-size-md, 1rem);
  }

  .btn-primary {
    background: var(--color-primary, #007bff);
    color: white;
  }

  .btn-secondary {
    background: var(--color-secondary, #6c757d);
    color: white;
  }

  .btn:hover {
    opacity: 0.9;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-lock {
    background: var(--color-warning, #ffc107);
    color: var(--color-on-warning, #000);
  }

  .btn-unlock {
    background: var(--color-info, #17a2b8);
    color: white;
  }

  .lock-banner {
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border-radius: var(--border-radius, 4px);
    margin-bottom: var(--space-md, 16px);
    font-weight: 500;
  }

  .lock-banner.hidden {
    display: none;
  }

  .banner-employee {
    background: rgb(255 193 7 / 15%);
    border: 1px solid var(--color-warning, #ffc107);
    color: var(--color-on-surface, #333);
  }

  .banner-admin {
    background: rgb(220 53 69 / 10%);
    border: 1px solid var(--color-error, #dc3545);
    color: var(--color-error, #dc3545);
  }
</style>`;
