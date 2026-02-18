/**
 * CSS styles for the dashboard navigation menu component.
 */
export const DASHBOARD_NAVIGATION_MENU_CSS = `
  :host {
    display: block;
  }

  .text-nowrap {
    white-space: nowrap;
  }

  .dashboard-navigation-menu {
    position: relative;
  }

  .menu-items.closed {
    display: none;
  }

  .menu-items.open {
    position: absolute;
    top: 100%;
    right: 0;
    background: var(--color-surface);
    border: var(--border-width) var(--border-style-solid) var(--color-border);
    border-radius: var(--border-radius-lg) 0 var(--border-radius-lg) var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    z-index: 1000;
    padding: var(--space-sm);
    min-width: 200px;
  }

  .menu-item {
    display: block;
    width: 100%;
    padding: var(--space-md) var(--space-lg);
    background: none;
    border: none;
    border-radius: var(--border-radius-md);
    color: var(--color-text);
    text-align: left;
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-normal);
    transition: background-color 0.2s ease;
  }

  .menu-item:hover {
    background: var(--color-surface-hover);
  }

  .menu-item.active {
    background: var(--color-primary-light);
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
  }

  .menu-item.logout {
    color: var(--color-error);
  }

  .menu-item.logout:hover {
    background: var(--color-error-light);
  }
`;
