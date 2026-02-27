export const styles = `<style>
  :host {
    display: block;
    padding: var(--space-md);
  }

  .toolbar {
    position: sticky;
    bottom: 0;
  }

  .page-heading {
    text-align: center;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin: var(--space-md) 0 var(--space-sm) 0;
  }

  .balance-heading {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: center;
    margin-bottom: var(--space-xs);
  }

  month-summary {
    margin-bottom: var(--space-md);
    justify-content: space-between;
  }

  .add-btn {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-md);
  }

  .add-btn:hover {
    opacity: 0.9;
  }
</style>`;
