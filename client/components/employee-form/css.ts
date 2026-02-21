export const styles = `<style>
  :host {
    display: block;
    background: var(--color-surface);
    border-radius: 8px;
    box-shadow: 0 2px 4px var(--color-shadow);
    max-width: 500px;
    margin: 0 auto;
  }

  .form-container {
    padding: 24px;
  }

  .form-header {
    margin-bottom: 24px;
    text-align: center;
  }

  .form-header h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text);
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: var(--color-text);
    font-size: 14px;
  }

  .form-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 14px;
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
    padding: 10px 12px;
    border: 1px solid var(--color-border);
    border-radius: 4px;
    font-size: 14px;
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
    font-size: 12px;
    margin-top: 4px;
    display: block;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid var(--color-border);
  }

  .btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
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
