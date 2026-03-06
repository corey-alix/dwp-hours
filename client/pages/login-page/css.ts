export const styles = `<style>
  :host {
    display: block;
    max-width: 400px;
    margin: 0 auto;
    padding: var(--space-lg, 24px);
  }

  h2 {
    text-align: center;
    color: var(--color-text, #333);
    margin-bottom: var(--space-md, 16px);
  }

  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm, 8px);
  }

  label {
    font-weight: var(--font-weight-semibold, 600);
    color: var(--color-text, #333);
  }

  input[type="email"] {
    padding: var(--space-sm, 8px);
    border: 1px solid var(--color-border, #ccc);
    border-radius: var(--border-radius, 4px);
    font-size: var(--font-size-md, 1rem);
  }

  button[type="submit"] {
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    background: var(--color-primary, #007bff);
    color: white;
    border: none;
    border-radius: var(--border-radius, 4px);
    cursor: pointer;
    font-size: var(--font-size-md, 1rem);
    margin-top: var(--space-sm, 8px);
  }

  button[type="submit"]:hover {
    opacity: 0.9;
  }

  button[type="submit"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .message {
    margin-top: var(--space-md, 16px);
    padding: var(--space-sm, 8px);
    border: 1px solid var(--color-border, #ccc);
    border-radius: var(--border-radius, 4px);
    background: var(--color-surface, #f9f9f9);
  }

  .message a {
    word-break: break-all;
    color: var(--color-primary, #007bff);
  }

  .hidden {
    display: none;
  }

  .divider {
    display: flex;
    align-items: center;
    margin: var(--space-lg, 24px) 0;
    gap: var(--space-sm, 8px);
  }

  .divider::before,
  .divider::after {
    content: "";
    flex: 1;
    border-bottom: 1px solid var(--color-border, #ccc);
  }

  .divider span {
    color: var(--color-text-muted, #888);
    font-size: var(--font-size-sm, 0.875rem);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .timesheet-login-section h3 {
    margin: 0 0 var(--space-xs, 4px) 0;
    color: var(--color-text, #333);
    font-size: var(--font-size-md, 1rem);
  }

  .timesheet-description {
    color: var(--color-text-muted, #888);
    font-size: var(--font-size-sm, 0.875rem);
    margin: 0 0 var(--space-sm, 8px) 0;
  }

  .file-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    flex-wrap: wrap;
  }

  .file-label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs, 4px);
    padding: var(--space-xs, 4px) var(--space-sm, 8px);
    border: 1px solid var(--color-border, #ccc);
    border-radius: var(--border-radius, 4px);
    cursor: pointer;
    font-size: var(--font-size-sm, 0.875rem);
    white-space: nowrap;
  }

  .file-label:hover {
    background: var(--color-surface, #f9f9f9);
  }

  input[type="file"] {
    display: none;
  }

  .file-name {
    font-size: var(--font-size-sm, 0.875rem);
    color: var(--color-text-muted, #888);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .error {
    color: var(--color-error, #dc3545);
  }

  .policy-link {
    margin-top: var(--space-lg, 24px);
    text-align: center;
  }

  .policy-link a {
    color: var(--color-primary, #007bff);
    text-decoration: none;
    font-size: var(--font-size-sm, 0.875rem);
  }

  .policy-link a:hover {
    text-decoration: underline;
  }

  .azure-login-section {
    text-align: center;
  }

  .btn-azure {
    display: inline-flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border: 1px solid var(--color-border, #ccc);
    border-radius: var(--border-radius, 4px);
    background: var(--color-surface, #fff);
    color: var(--color-text, #333);
    font-size: var(--font-size-md, 1rem);
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-azure:hover {
    background: var(--color-surface-hover, #f0f0f0);
  }
</style>`;
