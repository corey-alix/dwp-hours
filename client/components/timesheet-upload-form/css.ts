export const TIMESHEET_UPLOAD_FORM_CSS = `
  :host {
    display: block;
  }

  .upload-section {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-lg, 24px);
    max-width: 640px;
    margin: 0 auto;
  }

  h3 {
    margin: 0 0 var(--space-sm, 8px) 0;
    font-size: var(--font-size-lg, 1.25rem);
    font-weight: var(--font-weight-semibold, 600);
    color: var(--color-text);
  }

  .description {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm, 0.875rem);
    margin: 0 0 var(--space-md, 16px) 0;
    line-height: 1.5;
  }

  .file-label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs, 4px);
    padding: var(--space-sm, 8px) var(--space-md, 16px);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    background: var(--color-background);
    transition: background 0.15s;
  }

  .file-label:hover {
    background: var(--color-surface-hover, var(--color-surface));
  }

  input[type="file"] {
    display: none;
  }

  .file-name {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin-left: var(--space-sm);
  }

  .form-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    flex-wrap: wrap;
    margin-bottom: var(--space-md, 16px);
  }

  button[type="submit"] {
    padding: var(--space-sm, 8px) var(--space-lg, 24px);
    background: var(--color-primary);
    color: var(--color-on-primary, #fff);
    border: none;
    border-radius: var(--radius-sm, 4px);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold, 600);
    cursor: pointer;
    transition: opacity 0.15s;
  }

  button[type="submit"]:hover:not(:disabled) {
    opacity: 0.9;
  }

  button[type="submit"]:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .import-progress {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    padding: var(--space-sm, 8px) 0;
  }

  .import-status {
    margin-top: var(--space-sm, 8px);
  }

  .success {
    color: var(--color-success, #2e7d32);
    font-weight: var(--font-weight-semibold, 600);
  }

  .error {
    color: var(--color-error, #d32f2f);
    font-weight: var(--font-weight-semibold, 600);
  }

  .warning {
    color: var(--color-warning, #f57c00);
  }

  details {
    margin-top: var(--space-sm, 8px);
    font-size: var(--font-size-sm);
  }

  summary {
    cursor: pointer;
    font-weight: var(--font-weight-semibold, 600);
    padding: var(--space-xs, 4px) 0;
  }

  ul {
    margin: var(--space-xs, 4px) 0;
    padding-left: var(--space-lg, 24px);
  }

  li {
    margin-bottom: var(--space-xs, 4px);
    line-height: 1.4;
  }

  .month-result {
    padding: var(--space-xs, 4px) 0;
    border-bottom: 1px solid var(--color-border);
  }

  .month-result:last-child {
    border-bottom: none;
  }

  .month-name {
    font-weight: var(--font-weight-semibold, 600);
  }

  .status-imported {
    color: var(--color-success, #2e7d32);
  }

  .status-locked {
    color: var(--color-text-secondary);
    font-style: italic;
  }

  .severity-summary {
    display: flex;
    gap: var(--space-md, 16px);
    font-size: var(--font-size-sm);
    margin: var(--space-xs, 4px) 0;
  }

  .client-errors {
    background: rgb(211 47 47 / 8%);
    border: 1px solid var(--color-error, #d32f2f);
    border-radius: var(--radius-sm, 4px);
    padding: var(--space-md, 16px);
    margin-top: var(--space-md, 16px);
  }

  .client-errors h4 {
    margin: 0 0 var(--space-sm, 8px) 0;
    color: var(--color-error, #d32f2f);
  }
`;
