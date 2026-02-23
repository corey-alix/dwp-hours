export const styles = `<style>
  :host {
    display: block;
  }

  month-summary {
    position:sticky;
    top:56px;
    margin-bottom: var(--space-lg);
  }

  .pto-summary {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18em, 1fr));
    gap: var(--space-md, 0);
  }
</style>`;
