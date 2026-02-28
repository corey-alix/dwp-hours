export const styles = `<style>
  :host {
    display: block;
    padding: var(--space-md, 16px);
  }

  h2 {
    color: var(--color-text, #333);
    margin-bottom: var(--space-md, 16px);
  }

  h3 {
    color: var(--color-text, #333);
    margin-bottom: var(--space-sm, 8px);
  }

  .settings-section {
    background: var(--color-surface, #fff);
    border: 1px solid var(--color-border, #ddd);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-md, 16px);
    margin-bottom: var(--space-md, 16px);
  }

  .description {
    color: var(--color-text-secondary, #666);
    margin-bottom: var(--space-sm, 8px);
    font-size: 0.9rem;
  }

  #import-form {
    display: flex;
    align-items: center;
    gap: var(--space-sm, 8px);
    flex-wrap: wrap;
  }

  #excel-file {
    display: none;
  }

  .file-label {
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs, 4px);
    color: var(--color-text-alt, #333);
    padding: var(--space-xs, 4px) var(--space-sm, 8px);
    background: var(--color-surface-alt, #f5f5f5);
    border: 1px solid var(--color-border, #ddd);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 0.9rem;
    transition: background 0.15s;
  }

  .file-label:hover {
    background: var(--color-hover, #eee);
  }

  .file-name {
    color: var(--color-text-secondary, #666);
    font-size: 0.85rem;
    font-style: italic;
  }

  button[type="submit"] {
    padding: var(--space-xs, 4px) var(--space-md, 16px);
    background: var(--color-primary, #1a5276);
    color: #fff;
    border: none;
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    font-size: 0.9rem;
    transition: opacity 0.15s;
  }

  button[type="submit"]:hover:not([disabled]) {
    opacity: 0.9;
  }

  button[type="submit"][disabled] {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .import-status {
    margin-top: var(--space-sm, 8px);
  }

  .success {
    color: var(--color-success, #27ae60);
    font-weight: bold;
  }

  .error {
    color: var(--color-error, #e74c3c);
    font-weight: bold;
  }

  .warning {
    color: var(--color-warning, #f39c12);
    font-size: 0.85rem;
  }

  .warnings-details {
    margin-top: var(--space-xs, 4px);
  }

  .warnings-list {
    max-height: 200px;
    overflow-y: auto;
    padding-left: var(--space-md, 16px);
    font-size: 0.8rem;
    color: var(--color-warning, #f39c12);
  }

  .warnings-list li {
    color: var(--color-warning, #f39c12);
    margin-bottom: 2px;
  }

  .errors-details {
    margin-top: var(--space-xs, 4px);
  }

  .errors-list {
    max-height: 200px;
    overflow-y: auto;
    padding-left: var(--space-md, 16px);
    font-size: 0.8rem;
    color: var(--color-error, #e74c3c);
  }

  .errors-list li {
    color: var(--color-error, #e74c3c);
    margin-bottom: 2px;
  }

  .resolved {
    color: var(--color-success, #27ae60);
    font-size: 0.85rem;
  }

  .resolved-details {
    margin-top: var(--space-xs, 4px);
  }

  .resolved-list {
    max-height: 200px;
    overflow-y: auto;
    padding-left: var(--space-md, 16px);
    font-size: 0.8rem;
    color: var(--color-success, #27ae60);
  }

  .resolved-list li {
    color: var(--color-success, #27ae60);
    margin-bottom: 2px;
  }

  .severity-summary {
    font-size: 0.9rem;
    margin-top: var(--space-xs, 4px);
    margin-bottom: var(--space-xs, 4px);
  }

  details {
    margin-top: var(--space-xs, 4px);
  }

  summary {
    cursor: pointer;
    color: var(--color-text-secondary, #666);
    font-size: 0.9rem;
  }

  ul {
    padding-left: var(--space-md, 16px);
  }

  li {
    margin-bottom: var(--space-xs, 4px);
    color: var(--color-text-secondary, #666);
  }

  .import-progress {
    margin-top: var(--space-sm, 8px);
    color: var(--color-primary, #1a5276);
    font-size: 0.85rem;
    font-style: italic;
  }

  .import-mode {
    color: var(--color-primary, #1a5276);
    font-style: italic;
  }
</style>`;
