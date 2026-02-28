import { BaseComponent } from "../base-component.js";
import { DASHBOARD_NAVIGATION_MENU_CSS } from "./css.js";
import {
  adoptAnimations,
  animateSlide,
  type AnimationHandle,
} from "../../css-extensions/index.js";

type Page =
  | "current-year-summary"
  | "prior-year-summary"
  | "submit-time-off"
  | "upload-timesheet"
  | "admin/employees"
  | "admin/pto-requests"
  | "admin/monthly-review"
  | "admin/settings";

export class DashboardNavigationMenu extends BaseComponent {
  private isMenuOpen = false;
  private isAnimating = false;
  private currentAnimation: AnimationHandle | null = null;
  private boundHandleDocumentClick = this.handleDocumentClick.bind(this);
  private boundHandleDocumentKeydown = this.handleDocumentKeydown.bind(this);

  static get observedAttributes() {
    return ["current-page", "user-role"];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "current-page" || name === "user-role") {
      this.requestUpdate();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    adoptAnimations(this.shadowRoot);
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
    const menuItems: {
      id: string;
      label: string;
      isLogout?: boolean;
      isDownload?: boolean;
    }[] = [
      { id: "submit-time-off", label: "Submit Time Off" },
      { id: "current-year-summary", label: "Current Year Summary" },
      { id: "prior-year-summary", label: "Prior Year Summary" },
      { id: "upload-timesheet", label: "Upload Timesheet" },
    ];

    if (this.userRole === "Admin") {
      menuItems.push(
        { id: "admin/employees", label: "Employee Management" },
        { id: "admin/pto-requests", label: "PTO Requests" },
        { id: "admin/monthly-review", label: "Monthly Review" },
        { id: "admin/settings", label: "Settings" },
        {
          id: "download-report-html",
          label: "\u2B73 Report (HTML)",
          isDownload: true,
        },
        {
          id: "download-report-excel",
          label: "\u2B73 Report (Excel)",
          isDownload: true,
        },
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
              class="menu-item text-nowrap ${item.isLogout ? "logout" : ""} ${item.isDownload ? "download" : ""} ${this.currentPage === item.id ? "active" : ""}"
              data-action="${item.id}"
              aria-label="${item.isLogout ? "Logout" : item.isDownload ? "Download PTO Report" : `Switch to ${item.label}`}"
              ${!item.isLogout && !item.isDownload ? `aria-pressed="${this.currentPage === item.id}"` : ""}
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
      } else if (action === "download-report-html") {
        this.handleDownloadReport("html");
      } else if (action === "download-report-excel") {
        this.handleDownloadReport("excel");
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
        } else if (action === "download-report-html") {
          this.handleDownloadReport("html");
        } else if (action === "download-report-excel") {
          this.handleDownloadReport("excel");
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

  /** Cancel pending animation and clean up inline styles */
  private finalizeAnimation(): void {
    if (this.currentAnimation) {
      this.currentAnimation.cancel();
      this.currentAnimation = null;
    }
    this.isAnimating = false;
  }

  /**
   * Animate menu open with slide-down motion.
   * Delegates to the shared animation library's animateSlide helper.
   */
  private openMenuAnimated(): void {
    this.isMenuOpen = true;
    this.requestUpdate();

    const menuItems = this.shadowRoot.querySelector(
      ".menu-items",
    ) as HTMLElement;
    if (!menuItems) return;

    this.isAnimating = true;
    this.currentAnimation = animateSlide(menuItems, true);
    this.currentAnimation.promise.then(() => {
      this.currentAnimation = null;
      this.isAnimating = false;
    });
  }

  /**
   * Animate menu close with slide-up motion.
   * Delegates to the shared animation library's animateSlide helper.
   */
  private closeMenuAnimated(): void {
    const menuItems = this.shadowRoot.querySelector(
      ".menu-items",
    ) as HTMLElement;
    if (!menuItems) {
      this.isMenuOpen = false;
      this.requestUpdate();
      return;
    }

    this.isAnimating = true;
    this.currentAnimation = animateSlide(menuItems, false);
    this.currentAnimation.promise.then(() => {
      this.currentAnimation = null;
      this.isMenuOpen = false;
      this.isAnimating = false;
      this.requestUpdate();
    });
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

  private handleDownloadReport(format: "html" | "excel"): void {
    // Close the menu
    this.removeAutoCloseListeners();
    this.closeMenuAnimated();

    // Trigger download via direct navigation
    const year = new Date().getFullYear();
    window.location.href = `/api/admin/report?format=${format}&year=${year}`;
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
