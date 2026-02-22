import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { PtoSummaryCard } from "../../components/pto-summary-card/index.js";
import type { PtoPtoCard } from "../../components/pto-pto-card/index.js";
import type { PtoEmployeeInfoCard } from "../../components/pto-employee-info-card/index.js";
import type { MonthSummary } from "../../components/month-summary/index.js";
import type * as ApiTypes from "../../../shared/api-models.js";
import {
  getCurrentYear,
  formatDateForDisplay,
  parseDate,
  getWorkdaysBetween,
  formatDate,
  today,
} from "../../../shared/dateUtils.js";
import { computeAccrualToDate } from "../../../shared/businessRules.js";
import { styles } from "./css.js";

interface LoaderData {
  status: ApiTypes.PTOStatusResponse;
  entries: ApiTypes.PTOEntry[];
}

/**
 * Current Year Summary page.
 * Displays PTO summary cards, employee info, bucket details.
 * `navigate-to-month` events navigate to the Submit Time Off page.
 */
export class CurrentYearSummaryPage
  extends BaseComponent
  implements PageComponent
{
  private _loaderData: LoaderData | null = null;

  async onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void> {
    this._loaderData = (loaderData as LoaderData) ?? null;
    this.requestUpdate();

    // Wait a tick for the DOM to initialise
    await new Promise((r) => setTimeout(r, 0));
    this.populateCards();
    this.setupCardListeners();
  }

  protected render(): string {
    return `
      ${styles}
      <month-summary></month-summary>
      <div class="pto-summary">
        <pto-employee-info-card></pto-employee-info-card>
        <pto-pto-card></pto-pto-card>
      </div>
    `;
  }

  private populateCards(): void {
    if (!this._loaderData) return;
    const { status, entries } = this._loaderData;
    const year = getCurrentYear();

    // Summary card
    const summaryCard =
      this.shadowRoot.querySelector<PtoSummaryCard>("pto-summary-card");
    if (summaryCard) {
      summaryCard.summary = {
        annualAllocation: status.annualAllocation,
        availablePTO: status.availablePTO,
        usedPTO: status.usedPTO,
        carryoverFromPreviousYear: status.carryoverFromPreviousYear,
      };
    }

    // Employee info card
    const infoCard = this.shadowRoot.querySelector<PtoEmployeeInfoCard>(
      "pto-employee-info-card",
    );
    if (infoCard) {
      const storedUser = localStorage.getItem("currentUser");
      const employeeName = storedUser
        ? (JSON.parse(storedUser) as { name?: string }).name
        : undefined;
      infoCard.info = {
        employeeName,
        hireDate: formatDateForDisplay(status.hireDate),
        nextRolloverDate: formatDateForDisplay(status.nextRolloverDate, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        ...this.computeAccrualFields(status),
      };
    }

    // Month summary — balances (allocated) and hours (used) per type
    const monthSummary =
      this.shadowRoot.querySelector<MonthSummary>("month-summary");
    if (monthSummary) {
      const yearEntries = (Array.isArray(entries) ? entries : []).filter(
        (e) => parseDate(e.date).year === year,
      );
      const usedByType: Record<string, number> = {};
      for (const entry of yearEntries) {
        usedByType[entry.type] = (usedByType[entry.type] ?? 0) + entry.hours;
      }
      monthSummary.ptoHours = usedByType["PTO"] ?? 0;
      monthSummary.sickHours = usedByType["Sick"] ?? 0;
      monthSummary.bereavementHours = usedByType["Bereavement"] ?? 0;
      monthSummary.juryDutyHours = usedByType["Jury Duty"] ?? 0;
      monthSummary.balances = {
        PTO: status.ptoTime.allowed,
        Sick: status.sickTime.allowed,
        Bereavement: status.bereavementTime.allowed,
        "Jury Duty": status.juryDutyTime.allowed,
      };
    }

    // Unified detail card — all entries for the year
    const ptoCard = this.shadowRoot.querySelector<PtoPtoCard>("pto-pto-card");
    if (ptoCard) {
      ptoCard.fullPtoEntries = (Array.isArray(entries) ? entries : []).filter(
        (e) => parseDate(e.date).year === year,
      );
      ptoCard.isExpanded = true;
    }
  }

  private _cardListenersSetup = false;

  private setupCardListeners(): void {
    if (this._cardListenersSetup) return;
    this._cardListenersSetup = true;

    const handleNavToMonth = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const { month, year } = detail;
      window.dispatchEvent(
        new CustomEvent("router-navigate", {
          detail: { path: `/submit-time-off?month=${month}&year=${year}` },
        }),
      );
    };

    const card = this.shadowRoot.querySelector("pto-pto-card");
    if (card) {
      card.addEventListener("navigate-to-month", handleNavToMonth);
    }
  }

  // ── Shared helpers (moved from UIManager) ─────────────────────

  private computeAccrualFields(status: ApiTypes.PTOStatusResponse): {
    carryoverHours: number;
    ptoRatePerDay: number;
    accrualToDate: number;
    annualAllocation: number;
  } {
    const year = getCurrentYear();
    const totalWorkDays = getWorkdaysBetween(
      formatDate(year, 1, 1),
      formatDate(year, 12, 31),
    ).length;
    const ptoRatePerDay =
      totalWorkDays > 0 ? status.annualAllocation / totalWorkDays : 0;
    const fiscalYearStart = formatDate(year, 1, 1);
    const accrualToDate = computeAccrualToDate(
      ptoRatePerDay,
      fiscalYearStart,
      today(),
    );
    return {
      carryoverHours: status.carryoverFromPreviousYear,
      ptoRatePerDay,
      accrualToDate,
      annualAllocation: status.annualAllocation,
    };
  }
}

customElements.define("current-year-summary-page", CurrentYearSummaryPage);
