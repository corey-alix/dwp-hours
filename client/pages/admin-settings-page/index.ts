import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import { styles } from "./css.js";

/**
 * Admin Settings page.
 * Placeholder settings UI for holidays, sick day limits, accrual rates.
 */
export class AdminSettingsPage extends BaseComponent implements PageComponent {
  async onRouteEnter(): Promise<void> {
    this.requestUpdate();
  }

  protected render(): string {
    return `
      ${styles}
      <h2>System Settings</h2>
      <ul>
        <li>Total holidays for the year (placeholder)</li>
        <li>Total sick day limits (placeholder)</li>
        <li>Accrual rate rules (placeholder)</li>
      </ul>
    `;
  }
}

customElements.define("admin-settings-page", AdminSettingsPage);
