export const styles = `<style>
  :host {
    display: block;
    padding-bottom: var(--space-lg);
  }

  .page-heading {
    text-align: center;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin: var(--space-md) 0 var(--space-sm) 0;
  }

  .sticky-balance {
    position: sticky;
    top: 56px;
    z-index: 1;
    background: var(--color-background);
    margin-bottom: var(--space-sm);
  }

  .pto-summary {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }

  @media (min-width: 768px) {
    .pto-summary {
      display: grid;
      grid-template-columns: minmax(18em, 1fr) minmax(24em, 2fr);
      gap: var(--space-md);
    }
  }
</style>`;
