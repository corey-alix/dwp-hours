import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { PtoSummaryCard } from "../../components/pto-summary-card/index.js";
import type { PtoSickCard } from "../../components/pto-sick-card/index.js";
import type { PtoBereavementCard } from "../../components/pto-bereavement-card/index.js";
import type { PtoJuryDutyCard } from "../../components/pto-jury-duty-card/index.js";
import type { PtoPtoCard } from "../../components/pto-pto-card/index.js";
import type { PtoEmployeeInfoCard } from "../../components/pto-employee-info-card/index.js";
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
      <div class="pto-summary">
        <pto-employee-info-card></pto-employee-info-card>
        <pto-summary-card></pto-summary-card>
        <pto-pto-card></pto-pto-card>
        <pto-sick-card></pto-sick-card>
        <pto-bereavement-card></pto-bereavement-card>
        <pto-jury-duty-card></pto-jury-duty-card>
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
      infoCard.info = {
        hireDate: formatDateForDisplay(status.hireDate),
        nextRolloverDate: formatDateForDisplay(status.nextRolloverDate, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        ...this.computeAccrualFields(status),
      };
    }

    // Sick card
    const sickCard =
      this.shadowRoot.querySelector<PtoSickCard>("pto-sick-card");
    if (sickCard) {
      sickCard.bucket = status.sickTime;
      sickCard.usageEntries = this.buildUsageEntries(entries, year, "Sick");
      sickCard.fullPtoEntries = entries.filter(
        (e) => e.type === "Sick" && parseDate(e.date).year === year,
      );
    }

    // Bereavement card
    const bereavementCard = this.shadowRoot.querySelector<PtoBereavementCard>(
      "pto-bereavement-card",
    );
    if (bereavementCard) {
      bereavementCard.bucket = status.bereavementTime;
      bereavementCard.usageEntries = this.buildUsageEntries(
        entries,
        year,
        "Bereavement",
      );
      bereavementCard.fullPtoEntries = entries.filter(
        (e) => e.type === "Bereavement" && parseDate(e.date).year === year,
      );
    }

    // Jury duty card
    const juryDutyCard =
      this.shadowRoot.querySelector<PtoJuryDutyCard>("pto-jury-duty-card");
    if (juryDutyCard) {
      juryDutyCard.bucket = status.juryDutyTime;
      juryDutyCard.usageEntries = this.buildUsageEntries(
        entries,
        year,
        "Jury Duty",
      );
      juryDutyCard.fullPtoEntries = entries.filter(
        (e) => e.type === "Jury Duty" && parseDate(e.date).year === year,
      );
    }

    // PTO card
    const ptoCard = this.shadowRoot.querySelector<PtoPtoCard>("pto-pto-card");
    if (ptoCard) {
      ptoCard.bucket = status.ptoTime;
      ptoCard.usageEntries = this.buildUsageEntries(entries, year, "PTO");
      ptoCard.fullPtoEntries = entries.filter(
        (e) => e.type === "PTO" && parseDate(e.date).year === year,
      );
    }
  }

  private _cardListenersSetup = false;

  private setupCardListeners(): void {
    if (this._cardListenersSetup) return;
    this._cardListenersSetup = true;

    const handleNavToMonth = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const { month, year } = detail;
      // Navigate via the router
      window.dispatchEvent(
        new CustomEvent("router-navigate", {
          detail: { path: `/submit-time-off?month=${month}&year=${year}` },
        }),
      );
    };

    for (const tag of [
      "pto-sick-card",
      "pto-bereavement-card",
      "pto-jury-duty-card",
      "pto-pto-card",
    ]) {
      const card = this.shadowRoot.querySelector(tag);
      if (card) {
        card.addEventListener("navigate-to-month", handleNavToMonth);
      }
    }
  }

  // ── Shared helpers (moved from UIManager) ─────────────────────

  private buildUsageEntries(
    entries: ApiTypes.PTOEntry[],
    year: number,
    type: string,
  ): { date: string; hours: number }[] {
    const safe = Array.isArray(entries) ? entries : [];
    const hoursByDate = new Map<string, number>();

    for (const entry of safe) {
      if (entry.type !== type) continue;
      const { year: ey } = parseDate(entry.date);
      if (ey !== year) continue;
      hoursByDate.set(
        entry.date,
        (hoursByDate.get(entry.date) ?? 0) + entry.hours,
      );
    }

    return Array.from(hoursByDate.entries())
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

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
