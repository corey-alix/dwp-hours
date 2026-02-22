import { BaseComponent } from "../base-component.js";
import { DASHBOARD_NAVIGATION_MENU_CSS } from "./css.js";

type Page =
  | "current-year-summary"
  | "prior-year-summary"
  | "submit-time-off"
  | "admin/employees"
  | "admin/pto-requests"
  | "admin/monthly-review"
  | "admin/settings";

export class DashboardNavigationMenu extends BaseComponent {
  private isMenuOpen = false;
  private isAnimating = false;
  private animationFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  private boundHandleDocumentClick = this.handleDocumentClick.bind(this);
  private boundHandleDocumentKeydown = this.handleDocumentKeydown.bind(this);

  // Animation constants matching tokens.css --duration-normal, --easing-decelerate/--easing-accelerate
  private static readonly ANIM_DURATION_MS = 250;
  private static readonly ANIM_DURATION = "250ms";
  private static readonly EASING_OPEN = "cubic-bezier(0, 0, 0.2, 1)";
  private static readonly EASING_CLOSE = "cubic-bezier(0.4, 0, 1, 1)";
  private static readonly SLIDE_DISTANCE = "-8px";

  static get observedAttributes() {
    return ["current-page", "user-role"];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "current-page" || name === "user-role") {
      this.requestUpdate();
    }
  }

  disconnectedCallback() {
    this.removeAutoCloseListeners();
    super.disconnectedCallback();
  }

  get userRole(): string {
    return this.getAttribute("user-role") || "";
  }

  set userRole(value: string) {
    this.setAttribute("user-role", value);
  }

  get currentPage(): Page {
    return (this.getAttribute("current-page") as Page) || "default";
  }

  set currentPage(value: Page) {
    this.setAttribute("current-page", value);
  }

  set currentPageValue(value: Page) {
    this.currentPage = value;
  }

  protected render(): string {
    const menuItems: { id: string; label: string; isLogout?: boolean }[] = [
      { id: "submit-time-off", label: "Submit Time Off" },
      { id: "current-year-summary", label: "Current Year Summary" },
      { id: "prior-year-summary", label: "Prior Year Summary" },
    ];

    if (this.userRole === "Admin") {
      menuItems.push(
        { id: "admin/employees", label: "Employee Management" },
        { id: "admin/pto-requests", label: "PTO Requests" },
        { id: "admin/monthly-review", label: "Monthly Review" },
        { id: "admin/settings", label: "Settings" },
      );
    }

    menuItems.push({ id: "logout", label: "Logout", isLogout: true });

    return `
      <style>${DASHBOARD_NAVIGATION_MENU_CSS}</style>
      <div class="dashboard-navigation-menu">
        <button class="menu-toggle w-12 h-10" aria-label="Toggle navigation menu" aria-expanded="${this.isMenuOpen ? "true" : "false"}">
          &#9776;
        </button>
        <nav class="menu-items flex flex-col ${this.isMenuOpen ? "open" : "closed"}" role="navigation" aria-label="Dashboard pages">
          ${menuItems
            .map(
              (item) => `
            <button
              class="menu-item text-nowrap ${item.isLogout ? "logout" : ""} ${this.currentPage === item.id ? "active" : ""}"
              data-action="${item.id}"
              aria-label="${item.isLogout ? "Logout" : `Switch to ${item.label}`}"
              ${!item.isLogout ? `aria-pressed="${this.currentPage === item.id}"` : ""}
              tabindex="0"
            >
              ${item.label}
            </button>
          `,
            )
            .join("")}
        </nav>
      </div>
    `;
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;

    if (target.classList.contains("menu-toggle")) {
      this.toggleMenu();
    } else if (target.classList.contains("menu-item")) {
      const action = target.dataset.action;
      if (action === "logout") {
        this.handleLogout();
      } else if (action) {
        this.selectPage(action as Page);
      }
    }
  }

  protected handleDelegatedKeydown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;

    if (target.classList.contains("menu-item")) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const action = target.dataset.action;
        if (action === "logout") {
          this.handleLogout();
        } else if (action) {
          this.selectPage(action as Page);
        }
      }
    }
  }

  protected toggleMenu(): void {
    // If currently animating, finalize immediately so we can proceed
    if (this.isAnimating) {
      this.finalizeAnimation();
    }

    if (this.isMenuOpen) {
      this.removeAutoCloseListeners();
      this.closeMenuAnimated();
    } else {
      this.openMenuAnimated();
      this.addAutoCloseListeners();
    }
  }

  /** Cancel pending animation timer and clean up inline styles */
  private finalizeAnimation(): void {
    if (this.animationFallbackTimer) {
      clearTimeout(this.animationFallbackTimer);
      this.animationFallbackTimer = null;
    }
    const menuItems = this.shadowRoot.querySelector(
      ".menu-items",
    ) as HTMLElement;
    if (menuItems) {
      this.cleanupAnimationStyles(menuItems);
    }
    this.isAnimating = false;
  }

  /** Check reduced motion preference at animation time per SKILL.md */
  private prefersReducedMotion(): boolean {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /**
   * Animate menu open with slide-down motion (preferred over fade per SKILL.md).
   * Uses inline styles to avoid class specificity issues.
   * Forces synchronous reflow to commit initial position before transition.
   */
  private openMenuAnimated(): void {
    this.isMenuOpen = true;
    this.requestUpdate();

    if (this.prefersReducedMotion()) return;

    const menuItems = this.shadowRoot.querySelector(
      ".menu-items",
    ) as HTMLElement;
    if (!menuItems) return;

    this.isAnimating = true;

    // Phase 1: Set initial hidden position (slide up + transparent)
    menuItems.style.willChange = "transform, opacity";
    menuItems.style.transform = `translateY(${DashboardNavigationMenu.SLIDE_DISTANCE})`;
    menuItems.style.opacity = "0";

    // Force synchronous reflow per SKILL.md
    void menuItems.offsetHeight;

    // Phase 2: Animate to final visible position
    menuItems.style.transition = `transform ${DashboardNavigationMenu.ANIM_DURATION} ${DashboardNavigationMenu.EASING_OPEN}, opacity ${DashboardNavigationMenu.ANIM_DURATION} ${DashboardNavigationMenu.EASING_OPEN}`;
    menuItems.style.transform = "translateY(0)";
    menuItems.style.opacity = "1";

    const onComplete = () => {
      if (this.animationFallbackTimer) {
        clearTimeout(this.animationFallbackTimer);
        this.animationFallbackTimer = null;
      }
      menuItems.removeEventListener("transitionend", onEnd);
      this.cleanupAnimationStyles(menuItems);
      this.isAnimating = false;
    };

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "transform") return;
      onComplete();
    };
    menuItems.addEventListener("transitionend", onEnd);

    // Fallback timeout in case transitionend doesn't fire (element destroyed, test env, etc.)
    this.animationFallbackTimer = setTimeout(
      onComplete,
      DashboardNavigationMenu.ANIM_DURATION_MS + 50,
    );
  }

  /**
   * Animate menu close with slide-up motion.
   * Animates before DOM update to ensure visual transition.
   */
  private closeMenuAnimated(): void {
    if (this.prefersReducedMotion()) {
      this.isMenuOpen = false;
      this.requestUpdate();
      return;
    }

    const menuItems = this.shadowRoot.querySelector(
      ".menu-items",
    ) as HTMLElement;
    if (!menuItems) {
      this.isMenuOpen = false;
      this.requestUpdate();
      return;
    }

    this.isAnimating = true;

    // Animate to hidden position
    menuItems.style.willChange = "transform, opacity";
    menuItems.style.transition = `transform ${DashboardNavigationMenu.ANIM_DURATION} ${DashboardNavigationMenu.EASING_CLOSE}, opacity ${DashboardNavigationMenu.ANIM_DURATION} ${DashboardNavigationMenu.EASING_CLOSE}`;
    menuItems.style.transform = `translateY(${DashboardNavigationMenu.SLIDE_DISTANCE})`;
    menuItems.style.opacity = "0";

    const onComplete = () => {
      if (this.animationFallbackTimer) {
        clearTimeout(this.animationFallbackTimer);
        this.animationFallbackTimer = null;
      }
      menuItems.removeEventListener("transitionend", onEnd);
      this.cleanupAnimationStyles(menuItems);
      this.isMenuOpen = false;
      this.isAnimating = false;
      this.requestUpdate();
    };

    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "transform") return;
      onComplete();
    };
    menuItems.addEventListener("transitionend", onEnd);

    // Fallback timeout in case transitionend doesn't fire (element destroyed, test env, etc.)
    this.animationFallbackTimer = setTimeout(
      onComplete,
      DashboardNavigationMenu.ANIM_DURATION_MS + 50,
    );
  }

  /** Clean up inline animation styles to prevent stale state per SKILL.md */
  private cleanupAnimationStyles(element: HTMLElement): void {
    element.style.willChange = "";
    element.style.transition = "";
    element.style.transform = "";
    element.style.opacity = "";
  }

  /** Add document-level listeners for auto-close on outside click or Escape */
  private addAutoCloseListeners(): void {
    document.addEventListener("click", this.boundHandleDocumentClick);
    document.addEventListener("keydown", this.boundHandleDocumentKeydown);
  }

  /** Remove document-level auto-close listeners */
  private removeAutoCloseListeners(): void {
    document.removeEventListener("click", this.boundHandleDocumentClick);
    document.removeEventListener("keydown", this.boundHandleDocumentKeydown);
  }

  /** Close menu when clicking outside the component */
  private handleDocumentClick(e: Event): void {
    if (!this.isMenuOpen) return;
    const path = e.composedPath();
    if (!path.includes(this)) {
      this.removeAutoCloseListeners();
      this.closeMenuAnimated();
    }
  }

  /** Close menu on Escape key press */
  private handleDocumentKeydown(e: Event): void {
    if (!this.isMenuOpen) return;
    if ((e as KeyboardEvent).key === "Escape") {
      this.removeAutoCloseListeners();
      this.closeMenuAnimated();
    }
  }

  private selectPage(page: Page): void {
    this.removeAutoCloseListeners();
    this.currentPage = page;

    // Dispatch custom event immediately for responsive feedback
    this.dispatchEvent(
      new CustomEvent("page-change", {
        detail: { page },
        bubbles: true,
        composed: true,
      }),
    );

    // Animate menu close
    this.closeMenuAnimated();
  }

  private handleLogout(): void {
    // Close menu immediately — dashboard will be hidden by logout handler
    this.removeAutoCloseListeners();
    this.isMenuOpen = false;
    this.requestUpdate();

    // Dispatch logout event
    this.dispatchEvent(
      new CustomEvent("logout", {
        bubbles: true,
        composed: true,
      }),
    );
  }
}

customElements.define("dashboard-navigation-menu", DashboardNavigationMenu);
