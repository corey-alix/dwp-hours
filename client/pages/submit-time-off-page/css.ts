export const styles = `<style>
  :host {
    display: block;
    padding: var(--space-md, 16px);
    /* Reserve space for the sticky toolbar at the bottom */
    padding-bottom: 72px;
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

  /* ── Stage 4: Dim calendar when locked ── */

  pto-entry-form.locked {
    opacity: 0.5;
    pointer-events: none;
  }

  /* ── Stage 1: Sticky toolbar at bottom of viewport ── */

  .toolbar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
    background: var(--color-surface);
    border-top: 1px solid var(--color-border);
    box-shadow: 0 -2px 8px rgb(0 0 0 / 10%);
  }

  /* ── Buttons ── */

  .btn {
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border: none;
    border-radius: var(--border-radius, 4px);
    cursor: pointer;
    font-size: var(--font-size-md, 1rem);
    transition: opacity 0.2s ease, background-color 0.2s ease;
  }

  /* Stage 2: Submit is the most prominent */

  .btn-primary {
    background: var(--color-primary, #007bff);
    color: white;
    font-weight: 600;
  }

  .btn-primary:hover {
    opacity: 0.9;
  }

  /* Stage 2: Cancel is ghost/outlined */

  .btn-secondary {
    background: transparent;
    color: var(--color-secondary, #6c757d);
    border: 1px solid var(--color-secondary, #6c757d);
  }

  .btn-secondary:hover {
    background: var(--color-secondary, #6c757d);
    color: white;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Stage 2: Lock button toned down — neutral surface color */

  .btn-lock {
    background: var(--color-surface-hover, #e5e7eb);
    color: var(--color-text, #333);
    border: 1px solid var(--color-border);
  }

  .btn-lock:hover {
    background: var(--color-warning, #ffc107);
    color: var(--color-on-warning, #000);
  }

  .btn-unlock {
    background: var(--color-info, #17a2b8);
    color: white;
  }

  .btn-unlock:hover {
    opacity: 0.9;
  }

  /* ── Lock banner ── */

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

  /* ── Balance summary heading ── */

  .balance-heading {
    font-size: var(--font-size-xs, 12px);
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-align: center;
    margin-bottom: var(--space-xs, 4px);
  }

  @media (prefers-reduced-motion: reduce) {
    .btn {
      transition: none;
    }
  }
</style>`;
