import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { PriorYearReview } from "../../components/prior-year-review/index.js";
import type { PTOYearReviewResponse } from "../../../shared/api-models.js";
import { consumeContext, CONTEXT_KEYS } from "../../shared/context.js";
import type { TraceListener } from "../../controller/TraceListener.js";
import { getCurrentYear } from "../../../shared/dateUtils.js";
import { PRIOR_YEAR_NAV_MIN_YEARS } from "../../../shared/businessRules.js";
import { styles } from "./css.js";

/** Combined loader data for the prior year summary page. */
export interface PriorYearSummaryLoaderData {
  yearReview: PTOYearReviewResponse;
  availableYears: number[];
}

/**
 * Prior Year Summary page.
 * Wraps `<prior-year-review>` and injects loader data.
 * Displays a page heading, year navigation bar, and sticky annual summary bar.
 */
export class PriorYearSummaryPage
  extends BaseComponent
  implements PageComponent
{
  private _notifications: TraceListener | null = null;
  private _loaderData: PTOYearReviewResponse | null = null;
  private _availableYears: number[] = [];
  private _printMQ: MediaQueryList | null = null;
  private _rafId = 0;

  /**
   * Arrow-function handlers so they can be added/removed by reference
   * and survive across re-renders (managed outside BaseComponent's
   * addListener/cleanup cycle which is tied to renderTemplate).
   */
  private _handlePrintChange = (e: MediaQueryListEvent): void => {
    if (e.matches) {
      this._scaleToFitPage();
    } else {
      this._resetScale();
    }
  };

  private _handleResize = (): void => {
    if (!this._printMQ?.matches) return;
    cancelAnimationFrame(this._rafId);
    this._rafId = requestAnimationFrame(() => this._scaleToFitPage());
  };

  connectedCallback() {
    super.connectedCallback();
    consumeContext<TraceListener>(this, CONTEXT_KEYS.NOTIFICATIONS, (svc) => {
      this._notifications = svc;
    });

    // matchMedia('print').change fires in Chrome DevTools CSS print
    // emulation mode as well as during actual printing. The resize
    // listener re-evaluates scaling when the emulated device size changes.
    this._printMQ = window.matchMedia("print");
    this._printMQ.addEventListener("change", this._handlePrintChange);
    window.addEventListener("beforeprint", this._handleResize);
    window.addEventListener("afterprint", () => this._resetScale());
    window.addEventListener("resize", this._handleResize);

    // If page loads while already in print emulation mode
    if (this._printMQ.matches) {
      this._scaleToFitPage();
    }
  }

  disconnectedCallback() {
    this._resetScale();
    cancelAnimationFrame(this._rafId);
    this._printMQ?.removeEventListener("change", this._handlePrintChange);
    window.removeEventListener("beforeprint", this._handleResize);
    window.removeEventListener("resize", this._handleResize);
    this._printMQ = null;
    super.disconnectedCallback();
  }

  /**
   * Dynamically compute a zoom factor so the full page fits within one
   * printed page.  Works in both actual printing (via beforeprint) and
   * Chrome DevTools CSS print emulation + responsive-mode resizing.
   * Applies zoom to `document.body` so the entire page scales uniformly.
   */
  private _scaleToFitPage(): void {
    const body = document.body;
    // Reset any previous zoom so measurement is accurate
    body.style.zoom = "";
    const contentHeight = body.scrollHeight;
    const pageHeight = window.innerHeight;
    if (contentHeight > pageHeight && pageHeight > 0) {
      const scale = Math.floor((pageHeight / contentHeight) * 100) / 100;
      body.style.zoom = String(scale);
    }
  }

  /** Remove the print zoom after printing. */
  private _resetScale(): void {
    document.body.style.zoom = "";
  }

  async onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void> {
    const data = loaderData as PriorYearSummaryLoaderData | undefined;
    this._loaderData = data?.yearReview ?? null;
    this._availableYears = data?.availableYears ?? [];
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
        this._notifications?.error(
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

  private renderYearNav(year: number): string {
    const years = this._availableYears;
    if (years.length <= 1) return "";

    const idx = years.indexOf(year);
    // availableYears is sorted descending: [2025, 2024, 2023]
    // "next" = newer year = lower index, "prev" = older year = higher index
    const newerYear = idx > 0 ? years[idx - 1] : null;
    const olderYear = idx < years.length - 1 ? years[idx + 1] : null;

    return `
      <nav class="year-nav" aria-label="Year navigation">
        ${
          olderYear !== null
            ? `<a class="year-nav-btn" href="/prior-year-summary?year=${olderYear}" aria-label="View ${olderYear}">&laquo; ${olderYear}</a>`
            : `<span class="year-nav-btn disabled" aria-disabled="true">&laquo;</span>`
        }
        <span class="year-nav-current">${year}</span>
        ${
          newerYear !== null
            ? `<a class="year-nav-btn" href="/prior-year-summary?year=${newerYear}" aria-label="View ${newerYear}">${newerYear} &raquo;</a>`
            : `<span class="year-nav-btn disabled" aria-disabled="true">&raquo;</span>`
        }
      </nav>
    `;
  }

  private renderLegend(): string {
    return `
      <div class="legend">
        <div class="legend-item">
          <div class="legend-swatch pto-type-pto"></div>
          <span>PTO</span>
        </div>
        <div class="legend-item">
          <div class="legend-swatch pto-type-sick"></div>
          <span>Sick</span>
        </div>
        <div class="legend-item">
          <div class="legend-swatch pto-type-bereavement"></div>
          <span>Bereavement</span>
        </div>
        <div class="legend-item">
          <div class="legend-swatch pto-type-jury-duty"></div>
          <span>Jury Duty</span>
        </div>
      </div>
    `;
  }

  protected render(): string {
    const year = this._loaderData?.year ?? getCurrentYear() - 1;
    const totals = this.getAnnualTotals();

    return `
      ${styles}
      <div class="print-content">
        <h2 class="page-heading">${year} Prior Year Summary</h2>
        ${this.renderYearNav(year)}
        <div class="sticky-balance">
          <month-summary
            pto-hours="${totals.ptoHours}"
            sick-hours="${totals.sickHours}"
            bereavement-hours="${totals.bereavementHours}"
            jury-duty-hours="${totals.juryDutyHours}"
          ></month-summary>
        </div>
        ${this.renderLegend()}
        <prior-year-review id="prior-year-review"></prior-year-review>
      </div>
    `;
  }
}

customElements.define("prior-year-summary-page", PriorYearSummaryPage);
