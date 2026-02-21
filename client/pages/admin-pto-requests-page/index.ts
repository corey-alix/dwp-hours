import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import { styles } from "./css.js";

/**
 * Admin PTO Requests page.
 * Wraps `<pto-request-queue>`.
 */
export class AdminPtoRequestsPage
  extends BaseComponent
  implements PageComponent
{
  async onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    _loaderData?: unknown,
  ): Promise<void> {
    this.requestUpdate();
  }

  protected render(): string {
    return `
      ${styles}
      <h2>PTO Request Queue</h2>
      <pto-request-queue></pto-request-queue>
    `;
  }
}

customElements.define("admin-pto-requests-page", AdminPtoRequestsPage);
