import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import { styles } from "./css.js";
import { APIClient } from "../../APIClient.js";
import { ENABLE_BROWSER_IMPORT } from "../../../shared/businessRules.js";

const api = new APIClient();

/**
 * Admin Settings page.
 * Settings UI including Excel PTO spreadsheet import.
 *
 * When ENABLE_BROWSER_IMPORT is true, the Excel file is parsed entirely
 * in the browser (via ExcelJS loaded on demand) and only the resulting
 * JSON payload is sent to the server. This avoids OOM on the 512 MB
 * production droplet.
 */
export class AdminSettingsPage extends BaseComponent implements PageComponent {
  private importStatus: string = "";
  private isImporting: boolean = false;
  private importProgress: string = "";

  async onRouteEnter(): Promise<void> {
    this.importStatus = "";
    this.isImporting = false;
    this.importProgress = "";
    this.requestUpdate();
  }

  protected render(): string {
    return `
      ${styles}
      <h2>System Settings</h2>

      <section class="settings-section">
        <h3>Import PTO Spreadsheet</h3>
        <p class="description">Upload an exported Excel (.xlsx) PTO workbook to seed employee data, PTO entries, and acknowledgements for an entire year.</p>
        ${ENABLE_BROWSER_IMPORT ? '<p class="description import-mode">📱 Browser-side import enabled — file is parsed locally before sending to server.</p>' : ""}
        <form id="import-form">
          <label class="file-label" for="excel-file">
            <span class="file-icon">📂</span>
            Choose .xlsx file
          </label>
          <input type="file" id="excel-file" accept=".xlsx" />
          <span id="file-name" class="file-name"></span>
          <button type="submit" id="import-btn" ${this.isImporting ? "disabled" : ""}>
            ${this.isImporting ? "Importing…" : "Import"}
          </button>
        </form>
        ${this.importProgress ? `<div class="import-progress">${this.importProgress}</div>` : ""}
        ${this.importStatus ? `<div class="import-status">${this.importStatus}</div>` : ""}
      </section>

      <section class="settings-section">
        <h3>General Settings</h3>
        <ul>
          <li>Total holidays for the year (placeholder)</li>
          <li>Total sick day limits (placeholder)</li>
          <li>Accrual rate rules (placeholder)</li>
        </ul>
      </section>
    `;
  }

  // No handleDelegatedClick needed — <label for="excel-file"> natively
  // triggers the file input. Adding input.click() here caused a double prompt.

  protected override setupEventDelegation(): void {
    super.setupEventDelegation();

    // Use addListener so the change handler is tracked and cleaned up
    // before each re-render, preventing duplicate registrations.
    this.addListener(this.shadowRoot, "change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.id === "excel-file" && target.files?.length) {
        const nameSpan =
          this.shadowRoot.querySelector<HTMLSpanElement>("#file-name");
        if (nameSpan) nameSpan.textContent = target.files[0].name;
      }
    });
  }

  // Use the base class delegation pattern instead of a separate submit
  // listener to avoid duplicate handlers after re-renders.
  protected override handleDelegatedSubmit(e: Event): void {
    const form = (e.target as HTMLElement).closest("#import-form");
    if (form) {
      e.preventDefault();
      if (ENABLE_BROWSER_IMPORT) {
        this.handleBrowserImport();
      } else {
        this.handleImport();
      }
    }
  }

  /** Server-side import: upload .xlsx file as multipart form data. */
  private async handleImport(): Promise<void> {
    const input =
      this.shadowRoot.querySelector<HTMLInputElement>("#excel-file");
    if (!input?.files?.length) {
      this.importStatus =
        '<p class="error">Please select an .xlsx file first.</p>';
      this.requestUpdate();
      return;
    }

    this.isImporting = true;
    this.importStatus = "";
    this.requestUpdate();

    try {
      const result = await api.importExcel(input.files[0]);
      this.renderImportResult(result);
    } catch (err: any) {
      this.importStatus = `<p class="error">Import failed: ${err.message || err}</p>`;
    } finally {
      this.isImporting = false;
      this.requestUpdate();
    }
  }

  /** Browser-side import: parse .xlsx locally, send JSON to bulk API. */
  private async handleBrowserImport(): Promise<void> {
    const input =
      this.shadowRoot.querySelector<HTMLInputElement>("#excel-file");
    if (!input?.files?.length) {
      this.importStatus =
        '<p class="error">Please select an .xlsx file first.</p>';
      this.requestUpdate();
      return;
    }

    this.isImporting = true;
    this.importStatus = "";
    this.importProgress = "Loading Excel import module…";
    this.requestUpdate();

    try {
      // Lazy-load the Excel import module (includes ExcelJS ~300KB gzipped).
      // The module is built separately by esbuild and served at /excel-import.js.
      // Use a variable so TypeScript doesn't try to statically resolve the path.
      const importUrl = "/excel-import.js";
      const mod = (await import(
        /* webpackIgnore: true */
        /* @vite-ignore */
        importUrl
      )) as typeof import("../../import/excelImportClient.js");
      const { parseExcelInBrowser } = mod;

      // Parse the file in the browser
      const file = input.files[0];
      const { payload, warnings } = await parseExcelInBrowser(
        file,
        (progress: {
          phase: string;
          current: number;
          total: number;
          message?: string;
        }) => {
          this.importProgress = progress.message || `${progress.phase}…`;
          // Update the DOM directly for smooth progress without full re-render
          const progressEl =
            this.shadowRoot.querySelector<HTMLElement>(".import-progress");
          if (progressEl) progressEl.textContent = this.importProgress;
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

      // Send parsed data to the bulk API
      this.importProgress = `Uploading ${payload.employees.length} employee(s) to server…`;
      const progressEl =
        this.shadowRoot.querySelector<HTMLElement>(".import-progress");
      if (progressEl) progressEl.textContent = this.importProgress;

      const result = await api.importBulk(payload);
      this.importProgress = "";

      // Merge client-side warnings into result
      if (warnings.length > 0) {
        result.warnings = [...warnings, ...(result.warnings || [])];
      }

      this.renderImportResult(result);
    } catch (err: any) {
      this.importStatus = `<p class="error">Import failed: ${err.message || err}</p>`;
      this.importProgress = "";
    } finally {
      this.isImporting = false;
      this.requestUpdate();
    }
  }

  /** Render the import result into the status area. */
  private renderImportResult(result: any): void {
    const autoApprovedInfo = result.ptoEntriesAutoApproved
      ? ` (${result.ptoEntriesAutoApproved} auto-approved)`
      : "";
    this.importStatus = `
      <p class="success">${result.message}</p>
      <details>
        <summary>Details (${result.perEmployee?.length || 0} employees)</summary>
        <ul>
          ${(result.perEmployee || [])
            .map((e: any) => {
              const autoApproved = e.ptoEntriesAutoApproved
                ? ` (${e.ptoEntriesAutoApproved} auto-approved)`
                : "";
              return `<li>${e.name}: ${e.ptoEntries} PTO entries${autoApproved}, ${e.acknowledgements} acks${e.created ? " (new)" : ""}</li>`;
            })
            .join("")}
        </ul>
        ${
          result.warnings?.length
            ? `
          <details class="warnings-details">
            <summary class="warning">${result.warnings.length} warning${result.warnings.length === 1 ? "" : "s"}</summary>
            <ul class="warnings-list">
              ${result.warnings.map((w: string) => `<li>${w}</li>`).join("")}
            </ul>
          </details>
        `
            : ""
        }
      </details>
    `;
  }
}

customElements.define("admin-settings-page", AdminSettingsPage);
