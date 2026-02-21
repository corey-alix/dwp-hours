import type * as ApiTypes from "../../shared/api-models.js";
import { APIClient } from "../APIClient.js";

export interface AuthUser {
  id: number;
  name: string;
  role: string;
}

/**
 * Centralized authentication service.
 * Manages cookie-based sessions, magic-link validation, and user state.
 * Dispatches `auth-state-changed` on the global `window` when the user logs in/out.
 */
export class AuthService {
  private currentUser: AuthUser | null = null;
  private api: APIClient;

  constructor(api?: APIClient) {
    this.api = api ?? new APIClient();
  }

  // ── Cookie helpers ────────────────────────────────────────────

  setAuthCookie(hash: string): void {
    document.cookie = `auth_hash=${hash}; path=/; max-age=${10 * 365 * 24 * 60 * 60}`; // 10 years
  }

  getAuthCookie(): string | null {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "auth_hash") {
        return value;
      }
    }
    return null;
  }

  private clearAuthCookie(): void {
    document.cookie =
      "auth_hash=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }

  // ── Initialization ───────────────────────────────────────────

  /**
   * Check URL for magic-link token, then fall back to cookie-based session.
   * Returns the authenticated user or null.
   */
  async initialize(): Promise<AuthUser | null> {
    // Check URL params for magic link
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      try {
        const user = await this.validateToken(token);
        // Clean URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        return user;
      } catch {
        // Invalid token — fall through to session check
        this.logout();
        return null;
      }
    }

    // Check cookie
    const cookieHash = this.getAuthCookie();
    if (cookieHash) {
      return this.validateSession();
    }

    return null;
  }

  // ── Magic link ────────────────────────────────────────────────

  /** Request a magic link for the given email/identifier. */
  async requestMagicLink(
    identifier: string,
  ): Promise<{ message: string; magicLink?: string }> {
    return this.api.requestAuthLink(identifier);
  }

  /** Validate a magic-link token and establish a session. */
  async validateToken(token: string): Promise<AuthUser> {
    const response = (await this.api.validateAuth(
      token,
    )) as ApiTypes.AuthValidateResponse;
    this.setAuthCookie(response.authToken);
    const user: AuthUser = {
      id: (response.employee as any).id,
      name: (response.employee as any).name,
      role: (response.employee as any).role,
    };
    this.setUser(user);
    return user;
  }

  // ── Session ───────────────────────────────────────────────────

  /** Validate an existing cookie-based session. */
  async validateSession(): Promise<AuthUser | null> {
    try {
      const sessionResponse = await this.api.validateSession();
      if (sessionResponse.valid) {
        const employee = sessionResponse.employee;
        const user: AuthUser = {
          id: employee.id,
          name: employee.name,
          role: employee.role,
        };
        this.setUser(user);
        return user;
      }
    } catch {
      // Session invalid
    }
    this.logout();
    return null;
  }

  // ── Logout ────────────────────────────────────────────────────

  /** Log the user out: clear cookie, clear state. */
  logout(): void {
    this.currentUser = null;
    this.clearAuthCookie();
    localStorage.removeItem("currentUser");
    this.emitAuthStateChanged();
  }

  // ── Accessors ─────────────────────────────────────────────────

  /** Current authenticated user (or null). */
  getUser(): AuthUser | null {
    return this.currentUser;
  }

  /** Whether a user is currently authenticated. */
  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /** Whether the current user has a given role. */
  hasRole(role: string): boolean {
    return this.currentUser?.role === role;
  }

  // ── Internal ──────────────────────────────────────────────────

  private setUser(user: AuthUser): void {
    this.currentUser = user;
    localStorage.setItem("currentUser", JSON.stringify(user));
    this.emitAuthStateChanged();
  }

  private emitAuthStateChanged(): void {
    window.dispatchEvent(
      new CustomEvent("auth-state-changed", {
        detail: { user: this.currentUser },
      }),
    );
  }
}
