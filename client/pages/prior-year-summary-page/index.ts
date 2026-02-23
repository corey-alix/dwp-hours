import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { PriorYearReview } from "../../components/prior-year-review/index.js";
import type { PTOYearReviewResponse } from "../../../shared/api-models.js";
import { notifications } from "../../app.js";
import { getCurrentYear } from "../../../shared/dateUtils.js";
import { styles } from "./css.js";

/**
 * Prior Year Summary page.
 * Wraps `<prior-year-review>` and injects loader data.
 * Displays a page heading and sticky annual summary bar.
 */
export class PriorYearSummaryPage
  extends BaseComponent
  implements PageComponent
{
  private _loaderData: PTOYearReviewResponse | null = null;

  async onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void> {
    this._loaderData = (loaderData as PTOYearReviewResponse) ?? null;
    this.requestUpdate();

    // Wait a tick for the DOM to initialise
    await new Promise((r) => setTimeout(r, 0));

    const review =
      this.shadowRoot.querySelector<PriorYearReview>("prior-year-review");
    if (review) {
      if (this._loaderData) {
        review.data = this._loaderData;
      } else {
        review.data = null;
        notifications.error(
          "Failed to load prior year data. Please try again later.",
        );
      }
    }
  }

  private getAnnualTotals(): {
    ptoHours: number;
    sickHours: number;
    bereavementHours: number;
    juryDutyHours: number;
  } {
    if (!this._loaderData) {
      return {
        ptoHours: 0,
        sickHours: 0,
        bereavementHours: 0,
        juryDutyHours: 0,
      };
    }
    return this._loaderData.months.reduce(
      (acc, m) => ({
        ptoHours: acc.ptoHours + m.summary.ptoHours,
        sickHours: acc.sickHours + m.summary.sickHours,
        bereavementHours: acc.bereavementHours + m.summary.bereavementHours,
        juryDutyHours: acc.juryDutyHours + m.summary.juryDutyHours,
      }),
      { ptoHours: 0, sickHours: 0, bereavementHours: 0, juryDutyHours: 0 },
    );
  }

  protected render(): string {
    const year = this._loaderData?.year ?? getCurrentYear() - 1;
    const totals = this.getAnnualTotals();

    return `
      ${styles}
      <h2 class="page-heading">${year} Prior Year Summary</h2>
      <div class="sticky-balance">
        <month-summary
          pto-hours="${totals.ptoHours}"
          sick-hours="${totals.sickHours}"
          bereavement-hours="${totals.bereavementHours}"
          jury-duty-hours="${totals.juryDutyHours}"
        ></month-summary>
      </div>
      <prior-year-review id="prior-year-review"></prior-year-review>
    `;
  }
}

customElements.define("prior-year-summary-page", PriorYearSummaryPage);
