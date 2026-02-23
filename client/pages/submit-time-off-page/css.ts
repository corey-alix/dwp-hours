export const styles = `<style>
  :host {
    display: block;
    padding: var(--space-md, 16px);
  }

  #form-balance-summary {
    position: sticky;
    top: 64px;
    z-index: 1;
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
</style>`;
