import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { PriorYearReview } from "../../components/prior-year-review/index.js";
import { notifications } from "../../app.js";
import { styles } from "./css.js";

/**
 * Prior Year Summary page.
 * Wraps `<prior-year-review>` and injects loader data.
 */
export class PriorYearSummaryPage
  extends BaseComponent
  implements PageComponent
{
  async onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void> {
    this.requestUpdate();

    // Wait a tick for the DOM to initialise
    await new Promise((r) => setTimeout(r, 0));

    const review =
      this.shadowRoot.querySelector<PriorYearReview>("prior-year-review");
    if (review) {
      if (loaderData) {
        review.data = loaderData as any;
      } else {
        review.data = null;
        notifications.error(
          "Failed to load prior year data. Please try again later.",
        );
      }
    }
  }

  protected render(): string {
    return `
      ${styles}
      <prior-year-review id="prior-year-review"></prior-year-review>
    `;
  }
}

customElements.define("prior-year-summary-page", PriorYearSummaryPage);
