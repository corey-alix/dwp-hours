import { BaseComponent } from "../base-component.js";
import { TIMESHEET_UPLOAD_FORM_CSS } from "./css.js";
import { APIClient } from "../../APIClient.js";
import { MONTH_NAMES } from "../../../shared/businessRules.js";
import type {
  EmployeeImportBulkResponse,
  EmployeeImportMonthResult,
  BulkImportPtoEntry,
  BulkImportAcknowledgement,
} from "../../../shared/api-models.js";

const api = new APIClient();

/** Profile data needed for identity verification. */
export interface TimesheetUserProfile {
  name: string;
  hireDate: string;
}

/**
 * `<timesheet-upload-form>` — Employee timesheet upload web component.
 *
 * Parses an Excel PTO spreadsheet in the browser, verifies identity
 * (name + hire date), validates column S totals against calendar cells,
 * and submits structured JSON to `POST /api/employee/import-bulk`.
 */
export class TimesheetUploadForm extends BaseComponent {
  // ── Private state (view-model) ──
  private _profile: TimesheetUserProfile | null = null;
  private importStatus: string = "";
  private isImporting: boolean = false;
  private importProgress: string = "";
  private clientErrors: string[] = [];

  /** Set the user profile (name + hireDate) for identity verification. */
  get profile(): TimesheetUserProfile | null {
    return this._profile;
  }
  set profile(value: TimesheetUserProfile | null) {
    this._profile = value;
    this.requestUpdate();
  }

  protected render(): string {
    const profileWarning = !this._profile
      ? '<p class="error">Unable to load your profile. Please try again later.</p>'
      : "";

    return `
      <style>${TIMESHEET_UPLOAD_FORM_CSS}</style>
      <div class="upload-section">
        <h3>Upload Timesheet</h3>
        <p class="description">
          Upload your personal PTO spreadsheet (.xlsx) to import time-off entries.
          The spreadsheet name and hire date must match your account.
          Admin-locked months will be skipped.
        </p>
        ${profileWarning}
        <form id="upload-form">
          <div class="form-row">
            <label class="file-label" for="excel-file">
              <span class="file-icon">📂</span>
              Choose .xlsx file
            </label>
            <input type="file" id="excel-file" accept=".xlsx" />
            <span id="file-name" class="file-name"></span>
            <button type="submit" id="upload-btn" ${this.isImporting || !this._profile ? "disabled" : ""}>
              ${this.isImporting ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
        ${this.importProgress ? `<div class="import-progress">${this.importProgress}</div>` : ""}
        ${this.renderClientErrors()}
        ${this.importStatus ? `<div class="import-status">${this.importStatus}</div>` : ""}
      </div>
    `;
  }

  private renderClientErrors(): string {
    if (this.clientErrors.length === 0) return "";
    return `
      <div class="client-errors">
        <h4>Upload blocked — fix these issues in your spreadsheet:</h4>
        <ul>
          ${this.clientErrors.map((e) => `<li>${this.escapeHtml(e)}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  protected override setupEventDelegation(): void {
    super.setupEventDelegation();

    this.addListener(this.shadowRoot, "change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.id === "excel-file" && target.files?.length) {
        const nameSpan =
          this.shadowRoot.querySelector<HTMLSpanElement>("#file-name");
        if (nameSpan) nameSpan.textContent = target.files[0].name;
      }
    });
  }

  protected override handleDelegatedSubmit(e: Event): void {
    const form = (e.target as HTMLElement).closest("#upload-form");
    if (form) {
      e.preventDefault();
      this.handleUpload();
    }
  }

  private async handleUpload(): Promise<void> {
    const input =
      this.shadowRoot.querySelector<HTMLInputElement>("#excel-file");
    if (!input?.files?.length) {
      this.importStatus =
        '<p class="error">Please select an .xlsx file first.</p>';
      this.requestUpdate();
      return;
    }

    if (!this._profile) {
      this.importStatus =
        '<p class="error">Profile not loaded. Cannot verify identity.</p>';
      this.requestUpdate();
      return;
    }

    this.isImporting = true;
    this.importStatus = "";
    this.clientErrors = [];
    this.importProgress = "Loading Excel import module…";
    this.requestUpdate();

    try {
      // Lazy-load ExcelJS import module (same pattern as admin settings)
      const importUrl = "/excel-import.js";
      const mod = (await import(
        /* webpackIgnore: true */
        /* @vite-ignore */
        importUrl
      )) as typeof import("../../import/excelImportClient.js");
      const { parseExcelInBrowser } = mod;

      const file = input.files[0];
      const { payload, warnings } = await parseExcelInBrowser(
        file,
        (progress) => {
          this.importProgress = progress.message || `${progress.phase}…`;
          const el =
            this.shadowRoot.querySelector<HTMLElement>(".import-progress");
          if (el) el.textContent = this.importProgress;
        },
      );

      if (payload.employees.length === 0) {
        this.importStatus =
          '<p class="error">No employee sheets found in workbook.</p>';
        this.importProgress = "";
        this.isImporting = false;
        this.requestUpdate();
        return;
      }

      // Use the first (and presumably only) employee sheet
      const emp = payload.employees[0];

      // ── Client-side identity verification ──
      const normalize = (s: string) =>
        s.trim().replace(/\s+/g, " ").toLowerCase();
      const errors: string[] = [];

      if (normalize(emp.name) !== normalize(this._profile.name)) {
        errors.push(
          `Spreadsheet name "${emp.name}" does not match your account name "${this._profile.name}".`,
        );
      }

      if (
        this._profile.hireDate &&
        emp.hireDate &&
        emp.hireDate !== this._profile.hireDate
      ) {
        errors.push(
          `Spreadsheet hire date "${emp.hireDate}" does not match your account hire date "${this._profile.hireDate}".`,
        );
      }

      // ── Client-side column S reconciliation ──
      // parseExcelInBrowser already reconciles via parseEmployeeSheet.
      // Check for calendar-vs-column-S warnings from the parsing.
      const columnSWarnings = (emp.warnings || []).filter(
        (w) =>
          w.includes("column S") ||
          w.includes("Column S") ||
          w.includes("declared") ||
          w.includes("calendar total"),
      );
      if (columnSWarnings.length > 0) {
        errors.push(...columnSWarnings);
      }

      if (errors.length > 0) {
        this.clientErrors = errors;
        this.importProgress = "";
        this.isImporting = false;
        this.requestUpdate();
        return;
      }

      // ── Submit to server ──
      this.importProgress = "Uploading to server…";
      const el = this.shadowRoot.querySelector<HTMLElement>(".import-progress");
      if (el) el.textContent = this.importProgress;

      const year = emp.ptoEntries[0]
        ? parseInt(emp.ptoEntries[0].date.substring(0, 4), 10)
        : 0;

      const response = await this.submitToServer({
        employeeName: emp.name,
        hireDate: emp.hireDate,
        year,
        ptoEntries: emp.ptoEntries.map((e) => ({
          date: e.date,
          hours: e.hours,
          type: e.type,
          notes: e.notes || null,
          isNoteDerived: e.isNoteDerived,
        })),
        acknowledgements: emp.acknowledgements.map((a) => ({
          month: a.month,
          type: a.type,
          note: a.note || null,
          status: a.status || null,
        })),
      });

      this.importProgress = "";

      // Merge client-side warnings
      if (warnings.length > 0) {
        response.warnings = [...warnings, ...(response.warnings || [])];
      }

      this.renderImportResult(response);
    } catch (err: any) {
      if (err.responseData?.perMonth) {
        // 409 — all months locked
        this.renderImportResult(err.responseData);
      } else {
        this.importStatus = `<p class="error">Upload failed: ${this.escapeHtml(err.message || String(err))}</p>`;
      }
      this.importProgress = "";
    } finally {
      this.isImporting = false;
      this.requestUpdate();
    }
  }

  private async submitToServer(body: {
    employeeName: string;
    hireDate: string;
    year: number;
    ptoEntries: BulkImportPtoEntry[];
    acknowledgements: BulkImportAcknowledgement[];
  }): Promise<EmployeeImportBulkResponse> {
    const baseURL = api["baseURL"] as string; // access the base URL from APIClient
    const response = await fetch(`${baseURL}/employee/import-bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
      );
      (error as any).responseData = data;
      throw error;
    }
    return data as EmployeeImportBulkResponse;
  }

  private renderImportResult(result: EmployeeImportBulkResponse): void {
    const perMonth = result.perMonth || [];
    const imported = perMonth.filter((m) => m.status === "imported");
    const locked = perMonth.filter((m) => m.status === "skipped-locked");
    const warningsArr = result.warnings || [];

    const monthRows = perMonth
      .map((m) => {
        const monthIndex = parseInt(m.month.split("-")[1], 10) - 1;
        const name = MONTH_NAMES[monthIndex] || m.month;
        if (m.status === "skipped-locked") {
          return `<div class="month-result"><span class="month-name">${name}</span>: <span class="status-locked">Skipped (admin-locked)</span></div>`;
        }
        const parts = [`${m.entriesImported} imported`];
        if (m.entriesDeleted > 0) parts.push(`${m.entriesDeleted} replaced`);
        if (m.warnings.length > 0)
          parts.push(
            `<span class="warning">${m.warnings.length} warning(s)</span>`,
          );
        return `<div class="month-result"><span class="month-name">${name}</span>: <span class="status-imported">${parts.join(", ")}</span></div>`;
      })
      .join("");

    this.importStatus = `
      <p class="success">${this.escapeHtml(result.message || "Import complete.")}</p>
      ${
        warningsArr.length > 0
          ? `<div class="severity-summary"><span class="warning">${warningsArr.length} warning(s)</span></div>`
          : ""
      }
      <details open>
        <summary>Per-month breakdown (${imported.length} imported, ${locked.length} skipped)</summary>
        ${monthRows}
      </details>
      ${
        warningsArr.length > 0
          ? `
        <details>
          <summary class="warning">${warningsArr.length} warning(s)</summary>
          <ul>${warningsArr.map((w) => `<li>${this.escapeHtml(w)}</li>`).join("")}</ul>
        </details>
      `
          : ""
      }
    `;
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}

customElements.define("timesheet-upload-form", TimesheetUploadForm);
