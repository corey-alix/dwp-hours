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
</style>`;
