import { BaseComponent } from "../../components/base-component.js";

/**
 * 404 Not Found page.
 */
export class NotFoundPage extends BaseComponent {
  protected render(): string {
    return `
      <style>
        :host {
          display: block;
          text-align: center;
          padding: var(--space-xl, 48px) var(--space-md, 16px);
        }

        h2 { color: var(--color-text, #333); }

        p { color: var(--color-text-secondary, #666); }

        a {
          color: var(--color-primary, #007bff);
          text-decoration: none;
        }

        a:hover { text-decoration: underline; }
      </style>
      <h2>404 — Page Not Found</h2>
      <p>The page you're looking for doesn't exist.</p>
      <p><a href="/submit-time-off">Go to Submit Time Off</a></p>
    `;
  }
}

customElements.define("not-found-page", NotFoundPage);
