export const styles = `<style>
  :host {
    display: block;
    padding: var(--space-md, 16px);
  }

  h2 {
    color: var(--color-text, #333);
    margin-bottom: var(--space-md, 16px);
  }

  .actions {
    margin-bottom: var(--space-md, 16px);
  }

  .add-btn {
    background: var(--color-primary, #007bff);
    color: white;
    border: none;
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border-radius: var(--border-radius, 4px);
    cursor: pointer;
    font-size: var(--font-size-md, 1rem);
  }

  .add-btn:hover {
    opacity: 0.9;
  }
</style>`;
