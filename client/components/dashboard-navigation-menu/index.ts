import { BaseComponent } from "../base-component.js";
import { DASHBOARD_NAVIGATION_MENU_CSS } from "./css.js";

type Page = "default" | "current-year-summary" | "prior-year-summary";

export class DashboardNavigationMenu extends BaseComponent {
  private isMenuOpen = false;

  static get observedAttributes() {
    return ["current-page"];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
    if (name === "current-page") {
      this.requestUpdate();
    }
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
    const menuItems = [
      { id: "default", label: "Default" },
      { id: "current-year-summary", label: "Current Year Summary" },
      { id: "prior-year-summary", label: "Prior Year Summary" },
      { id: "logout", label: "Logout", isLogout: true },
    ];

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
    this.isMenuOpen = !this.isMenuOpen;
    this.requestUpdate();
  }

  private selectPage(page: Page): void {
    this.currentPage = page;
    this.isMenuOpen = false; // Close menu on mobile after selection
    this.requestUpdate();

    // Dispatch custom event
    this.dispatchEvent(
      new CustomEvent("page-change", {
        detail: { page },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private handleLogout(): void {
    this.isMenuOpen = false; // Close menu on mobile after logout
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
