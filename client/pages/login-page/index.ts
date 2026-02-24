import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { AuthService } from "../../auth/auth-service.js";
import { styles } from "./css.js";

/**
 * Login page component.
 * Displays a magic-link login form that delegates authentication to AuthService.
 * Fires `login-success` (bubbles, composed) with user data on successful auth.
 */
export class LoginPage extends BaseComponent implements PageComponent {
  private _message = "";
  private _magicLink = "";
  private _authService: AuthService | null = null;

  set authService(svc: AuthService) {
    this._authService = svc;
  }

  onRouteEnter(): void {
    this._message = "";
    this._magicLink = "";
    this.requestUpdate();
  }

  protected render(): string {
    return `
      ${styles}
      <h2>Login</h2>
      <form id="login-form">
        <label for="identifier">Email:</label>
        <input type="email" id="identifier" required />
        <button type="submit">Send Magic Link</button>
      </form>
      <div id="login-message" class="${this._message ? "message" : "hidden"}">
        ${this.renderMessage()}
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

  protected handleDelegatedSubmit(e: Event): void {
    e.preventDefault();
    const form = (e.target as HTMLElement).closest("form");
    if (form?.id === "login-form") {
      this.handleLogin();
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
}

customElements.define("login-page", LoginPage);
