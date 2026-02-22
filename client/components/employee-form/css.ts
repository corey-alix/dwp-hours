export const styles = `<style>
  :host {
    display: block;
    background: var(--color-surface);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-md);
    max-width: 500px;
    margin: 0 auto;
  }

  .form-container {
    padding: var(--space-lg);
  }

  .form-header {
    margin-bottom: var(--space-lg);
    text-align: center;
  }

  .form-header h2 {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
  }

  .form-group {
    margin-bottom: var(--space-md);
  }

  .form-label {
    display: block;
    margin-bottom: var(--space-xs);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
    font-size: var(--font-size-sm);
  }

  .form-input {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    transition: border-color 0.3s ease;
    box-sizing: border-box;
    background: var(--color-surface);
    color: var(--color-text);
  }

  .form-input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }

  .form-input.error {
    border-color: var(--color-error);
  }

  .form-select {
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    border: var(--border-width) solid var(--color-border);
    border-radius: var(--border-radius);
    font-size: var(--font-size-sm);
    background: var(--color-surface);
    color: var(--color-text);
    cursor: pointer;
    box-sizing: border-box;
  }

  .form-select:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-light);
  }

  .error-message {
    color: var(--color-error);
    font-size: var(--font-size-xs);
    margin-top: var(--space-xs);
    display: block;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
  }

  .form-actions {
    display: flex;
    gap: var(--space-sm);
    justify-content: flex-end;
    margin-top: var(--space-xl);
    padding-top: var(--space-md);
    border-top: var(--border-width) solid var(--color-border);
  }

  .btn {
    padding: var(--space-sm) var(--space-lg);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    transition: all 0.3s ease;
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
  }

  .btn-primary:hover {
    background: var(--color-primary-hover);
  }

  .btn-secondary {
    background: var(--color-secondary);
    color: white;
  }

  .btn-secondary:hover {
    background: var(--color-secondary-hover);
  }

  .required {
    color: var(--color-error);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .btn:disabled:hover {
    background: inherit;
  }
</style>`;
