import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { PtoPtoCard } from "../../components/pto-pto-card/index.js";
import type { PtoEmployeeInfoCard } from "../../components/pto-employee-info-card/index.js";
import type { BalanceTable } from "../../components/balance-table/index.js";
import type * as ApiTypes from "../../../shared/api-models.js";
import {
  getCurrentYear,
  formatDateForDisplay,
  parseDate,
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
    const year = getCurrentYear();
    return `
      ${styles}
      <h2 class="page-heading">${year} Year Summary</h2>
      <div class="sticky-balance">
        <balance-table></balance-table>
      </div>
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
        nextRolloverDate: formatDateForDisplay(status.nextRolloverDate),
        ...this.computeAccrualFields(status),
      };
    }

    // Compute used hours by type
    const yearEntries = (Array.isArray(entries) ? entries : []).filter(
      (e) => parseDate(e.date).year === year,
    );
    const usedByType: Record<string, number> = {};
    for (const entry of yearEntries) {
      usedByType[entry.type] = (usedByType[entry.type] ?? 0) + entry.hours;
    }

    // Balance table — unified Issued / Used / Avail grid
    const balanceTable =
      this.shadowRoot.querySelector<BalanceTable>("balance-table");
    if (balanceTable) {
      balanceTable.data = {
        pto: {
          issued: status.ptoTime.allowed,
          used: usedByType["PTO"] ?? 0,
        },
        sick: {
          issued: status.sickTime.allowed,
          used: usedByType["Sick"] ?? 0,
        },
        bereavement: {
          issued: status.bereavementTime.allowed,
          used: usedByType["Bereavement"] ?? 0,
        },
        juryDuty: {
          issued: status.juryDutyTime.allowed,
          used: usedByType["Jury Duty"] ?? 0,
        },
      };
    }

    // Unified detail card — all entries for the year
    const ptoCard = this.shadowRoot.querySelector<PtoPtoCard>("pto-pto-card");
    if (ptoCard) {
      ptoCard.fullPtoEntries = (Array.isArray(entries) ? entries : []).filter(
        (e) => parseDate(e.date).year === year,
      );
      // Expanded state restored from localStorage by the card itself
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
    // Use the policy-based daily rate from the server
    const ptoRatePerDay = status.dailyRate;
    // Accrue from the later of Jan 1 or hire date
    const jan1 = formatDate(year, 1, 1);
    const hireDate = status.hireDate;
    const accrualStart = hireDate > jan1 ? hireDate : jan1;
    const accrualToDate = computeAccrualToDate(
      ptoRatePerDay,
      accrualStart,
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
