export const styles = `<style>
  :host {
    display: block;
    padding: var(--space-md, 16px);
    padding-bottom: var(--space-lg);
  }

  .page-heading {
    text-align: center;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
    margin: var(--space-md) 0 var(--space-sm) 0;
  }

  .year-nav {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--space-md, 16px);
    margin-bottom: var(--space-sm, 8px);
  }

  .year-nav-btn {
    display: inline-flex;
    align-items: center;
    padding: var(--space-xs, 4px) var(--space-sm, 8px);
    border: 1px solid var(--color-border, #ccc);
    border-radius: var(--radius-sm, 4px);
    background: var(--color-surface, #fff);
    color: var(--color-primary, #0066cc);
    font-size: var(--font-size-sm, 14px);
    font-weight: var(--font-weight-medium, 500);
    text-decoration: none;
    cursor: pointer;
    transition: background 200ms ease, color 200ms ease;
  }

  .year-nav-btn:hover:not(.disabled) {
    background: var(--color-surface-hover, #f0f0f0);
  }

  .year-nav-btn:focus-visible {
    outline: 2px solid var(--color-primary, #0066cc);
    outline-offset: 2px;
  }

  .year-nav-btn.disabled {
    opacity: 0.35;
    cursor: default;
    pointer-events: none;
  }

  .year-nav-current {
    font-size: var(--font-size-lg, 18px);
    font-weight: var(--font-weight-bold, 700);
    color: var(--color-text);
    min-width: 3em;
    text-align: center;
  }

  .sticky-balance {
    position: sticky;
    top: 56px;
    z-index: 1;
    background: var(--color-background);
    margin-bottom: var(--space-sm);
  }

  @media (prefers-reduced-motion: reduce) {
    .year-nav-btn {
      transition: none;
    }
  }
</style>`;
