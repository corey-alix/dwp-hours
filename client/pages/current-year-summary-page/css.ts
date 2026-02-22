export const styles = `<style>
  :host {
    display: block;
    padding: var(--space-md, 16px);
  }

  month-summary {
    position:sticky;
    top:56px;
  }

  .pto-summary {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(18em, 1fr));
    gap: var(--space-md, 0);
    margin-top: var(--space-md, 0);
  }
</style>`;
