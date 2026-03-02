import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { AuthService } from "../../auth/auth-service.js";
import type { TimesheetLoginResponse } from "../../../shared/api-models.js";
import { styles } from "./css.js";

/**
 * Login page component.
 * Displays a magic-link login form that delegates authentication to AuthService.
 * Also offers "Sign in with Timesheet" — uploading a valid PTO spreadsheet as a credential.
 * Fires `login-success` (bubbles, composed) with user data on successful auth.
 */
export class LoginPage extends BaseComponent implements PageComponent {
  private _message = "";
  private _magicLink = "";
  private _authService: AuthService | null = null;
  private _timesheetMessage = "";
  private _timesheetParsing = false;
  private _timesheetFileName = "";

  set authService(svc: AuthService) {
    this._authService = svc;
  }

  onRouteEnter(): void {
    this._message = "";
    this._magicLink = "";
    this._timesheetMessage = "";
    this._timesheetParsing = false;
    this._timesheetFileName = "";
    this.requestUpdate();
  }

  protected render(): string {
    return `
      ${styles}
      <form id="login-form">
        <label for="identifier">Email:</label>
        <input type="email" id="identifier" required />
        <button type="submit">Send Magic Link</button>
      </form>
      <div id="login-message" class="${this._message ? "message" : "hidden"}">
        ${this.renderMessage()}
      </div>

      <div class="divider"><span>or</span></div>

      <div class="timesheet-login-section">
        <h3>Sign in with your timesheet</h3>
        <p class="timesheet-description">
          Upload your personal PTO spreadsheet (.xlsx) to sign in and import your data.
        </p>
        <form id="timesheet-login-form">
          <div class="file-row">
            <label class="file-label" for="timesheet-file">
              <span class="file-icon">📂</span>
              Choose .xlsx file
            </label>
            <input type="file" id="timesheet-file" accept=".xlsx" />
            <span id="timesheet-file-name" class="file-name">${this._timesheetFileName ? this.escapeHtml(this._timesheetFileName) : ""}</span>
          </div>
          <button type="submit" id="timesheet-login-btn" ${this._timesheetParsing ? "disabled" : ""}>
            ${this._timesheetParsing ? "Signing in…" : "Sign In with Timesheet"}
          </button>
        </form>
        <div id="timesheet-message" class="${this._timesheetMessage ? "message" : "hidden"}">
          ${this._timesheetMessage}
        </div>
      </div>

      <div class="policy-link">
        <a href="/POLICY.html" target="_blank" rel="noopener noreferrer">View PTO Policy</a>
      </div>
    `;
  }

  private renderMessage(): string {
    if (!this._message) return "";
    const linkHtml = this._magicLink
      ? `<div style="margin-top:8px"><a href="${this._magicLink}" rel="noopener noreferrer">${this._magicLink}</a></div>`
      : "";
    return `<div>${this._message}</div>${linkHtml}`;
  }

  protected override setupEventDelegation(): void {
    super.setupEventDelegation();

    this.addListener(this.shadowRoot, "change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.id === "timesheet-file" && target.files?.length) {
        this._timesheetFileName = target.files[0].name;
        const nameSpan = this.shadowRoot.querySelector<HTMLSpanElement>(
          "#timesheet-file-name",
        );
        if (nameSpan) nameSpan.textContent = target.files[0].name;
      }
    });
  }

  protected handleDelegatedSubmit(e: Event): void {
    e.preventDefault();
    const form = (e.target as HTMLElement).closest("form");
    if (form?.id === "login-form") {
      this.handleLogin();
    } else if (form?.id === "timesheet-login-form") {
      this.handleTimesheetLogin();
    }
  }

  private async handleLogin(): Promise<void> {
    if (!this._authService) {
      console.error("LoginPage: AuthService not set");
      return;
    }

    const input =
      this.shadowRoot.querySelector<HTMLInputElement>("#identifier");
    if (!input) return;
    const identifier = input.value;

    try {
      const response = await this._authService.requestMagicLink(identifier);
      this._message = response.message;
      this._magicLink = response.magicLink ?? "";

      // In dev mode, if a magicLink URL is returned, auto-validate the token
      if (this._magicLink) {
        const url = new URL(this._magicLink, window.location.origin);
        const token = url.searchParams.get("token");
        if (token) {
          try {
            const user = await this._authService.validateToken(token);
            this.dispatchEvent(
              new CustomEvent("login-success", {
                detail: { user },
                bubbles: true,
                composed: true,
              }),
            );
            return;
          } catch {
            // Token validation failed, show the link to user
          }
        }
      }

      this.requestUpdate();
    } catch (error) {
      console.error("Failed to send magic link:", error);
      this._message = "Failed to send magic link. Please try again.";
      this._magicLink = "";
      this.requestUpdate();
    }
  }

  private async handleTimesheetLogin(): Promise<void> {
    if (!this._authService) {
      console.error("LoginPage: AuthService not set");
      return;
    }

    const input =
      this.shadowRoot.querySelector<HTMLInputElement>("#timesheet-file");
    if (!input?.files?.length) {
      this._timesheetMessage =
        '<span class="error">Please select an .xlsx file first.</span>';
      this.requestUpdate();
      return;
    }

    this._timesheetParsing = true;
    this._timesheetMessage = "Loading spreadsheet…";
    this.requestUpdate();

    try {
      // Lazy-load the Excel parser to keep main bundle small
      this._timesheetMessage = "Parsing spreadsheet…";
      this.requestUpdate();
      const { parseExcelInBrowser } =
        await import("../../import/excelImportClient.js");

      const file = input.files[0];
      const { payload, errors } = await parseExcelInBrowser(
        file,
        (progress) => {
          this._timesheetMessage = progress.message || "Processing…";
          this.requestUpdate();
        },
      );

      // Reject multi-employee workbooks
      if (payload.employees.length !== 1) {
        this._timesheetMessage = `<span class="error">Expected a single-employee spreadsheet but found ${payload.employees.length} employee sheet(s).</span>`;
        this._timesheetParsing = false;
        this.requestUpdate();
        return;
      }

      // Show any parsing errors
      if (errors.length > 0) {
        this._timesheetMessage = `<span class="error">Spreadsheet errors:<br>${errors.map((e) => this.escapeHtml(e)).join("<br>")}</span>`;
        this._timesheetParsing = false;
        this.requestUpdate();
        return;
      }

      // Send to the timesheet-login endpoint
      this._timesheetMessage = "Authenticating…";
      this.requestUpdate();

      const api = (this._authService as any).api;
      let response: TimesheetLoginResponse;
      try {
        response = await api.timesheetLogin({ employees: payload.employees });
      } catch (err: unknown) {
        // Handle known HTTP error statuses
        const responseData = (err as any)?.responseData;
        if (responseData) {
          // 409 means all months locked but auth succeeded
          if (responseData.authToken) {
            response = responseData as TimesheetLoginResponse;
          } else {
            this._timesheetMessage = `<span class="error">${this.escapeHtml(responseData.error || "Login failed.")}</span>`;
            this._timesheetParsing = false;
            this.requestUpdate();
            return;
          }
        } else {
          throw err;
        }
      }

      // Establish session (cookie + in-memory user state)
      const user = {
        id: response.employee.id,
        name: response.employee.name,
        role: response.employee.role,
      };
      this._authService.establishSession(response.authToken, user);

      this.dispatchEvent(
        new CustomEvent("login-success", {
          detail: {
            user,
            importResult: response.importResult,
          },
          bubbles: true,
          composed: true,
        }),
      );
    } catch (error: unknown) {
      console.error("Timesheet login failed:", error);
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred";
      this._timesheetMessage = `<span class="error">${this.escapeHtml(message)}</span>`;
      this._timesheetParsing = false;
      this.requestUpdate();
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
}

customElements.define("login-page", LoginPage);
