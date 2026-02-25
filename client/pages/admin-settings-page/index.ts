import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import { styles } from "./css.js";
import { APIClient } from "../../APIClient.js";

const api = new APIClient();

/**
 * Admin Settings page.
 * Settings UI including Excel PTO spreadsheet import.
 */
export class AdminSettingsPage extends BaseComponent implements PageComponent {
  private importStatus: string = "";
  private isImporting: boolean = false;

  async onRouteEnter(): Promise<void> {
    this.importStatus = "";
    this.isImporting = false;
    this.requestUpdate();
  }

  protected render(): string {
    return `
      ${styles}
      <h2>System Settings</h2>

      <section class="settings-section">
        <h3>Import PTO Spreadsheet</h3>
        <p class="description">Upload an exported Excel (.xlsx) PTO workbook to seed employee data, PTO entries, and acknowledgements for an entire year.</p>
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

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;
    if (target.matches(".file-label") || target.closest(".file-label")) {
      const input =
        this.shadowRoot.querySelector<HTMLInputElement>("#excel-file");
      input?.click();
    }
  }

  protected override setupEventDelegation(): void {
    super.setupEventDelegation();

    this.shadowRoot.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.id === "excel-file" && target.files?.length) {
        const nameSpan =
          this.shadowRoot.querySelector<HTMLSpanElement>("#file-name");
        if (nameSpan) nameSpan.textContent = target.files[0].name;
      }
    });

    this.shadowRoot.addEventListener("submit", (e) => {
      const form = (e.target as HTMLElement).closest("#import-form");
      if (form) {
        e.preventDefault();
        this.handleImport();
      }
    });
  }

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
      this.importStatus = `
        <p class="success">${result.message}</p>
        <details>
          <summary>Details (${result.perEmployee?.length || 0} employees)</summary>
          <ul>
            ${(result.perEmployee || []).map((e: any) => `<li>${e.name}: ${e.ptoEntries} PTO entries, ${e.acknowledgements} acks${e.created ? " (new)" : ""}</li>`).join("")}
          </ul>
          ${result.warnings?.length ? `<p class="warning">Warnings: ${result.warnings.join("; ")}</p>` : ""}
        </details>
      `;
    } catch (err: any) {
      this.importStatus = `<p class="error">Import failed: ${err.message || err}</p>`;
    } finally {
      this.isImporting = false;
      this.requestUpdate();
    }
  }
}

customElements.define("admin-settings-page", AdminSettingsPage);
