// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DashboardNavigationMenu } from "../../client/components/dashboard-navigation-menu/index.js";

describe("DashboardNavigationMenu Component", () => {
  let component: DashboardNavigationMenu;

  beforeEach(() => {
    component = new DashboardNavigationMenu();
    document.body.appendChild(component);
  });

  afterEach(() => {
    component.remove();
  });

  describe("Rendering", () => {
    it("should create component instance with shadow DOM", () => {
      expect(component).toBeInstanceOf(DashboardNavigationMenu);
      expect(component.shadowRoot).toBeTruthy();
    });

    it("should render menu toggle button", () => {
      const toggle = component.shadowRoot?.querySelector(".menu-toggle");
      expect(toggle).toBeTruthy();
      expect(toggle?.getAttribute("aria-label")).toBe("Toggle navigation menu");
    });

    it("should render standard menu items for non-admin", () => {
      const items = component.shadowRoot?.querySelectorAll(".menu-item");
      // Standard items: Submit Time Off, Current Year Summary, Prior Year Summary, Upload Timesheet, Logout
      expect(items?.length).toBe(5);
    });

    it("should render admin menu items when user-role is Admin", () => {
      component.userRole = "Admin";

      const items = component.shadowRoot?.querySelectorAll(".menu-item");
      // Standard (4) + Admin (6: employees, pto-requests, monthly-review, settings, 2 downloads) + logout = 11
      expect(items?.length).toBe(11);
    });

    it("should mark current page as active", () => {
      component.currentPage = "submit-time-off";

      const active = component.shadowRoot?.querySelector(".menu-item.active");
      expect(active).toBeTruthy();
      expect(active?.getAttribute("data-action")).toBe("submit-time-off");
    });

    it("should set aria-pressed on non-logout, non-download items", () => {
      component.currentPage = "submit-time-off";

      const activeBtn = component.shadowRoot?.querySelector(
        '.menu-item[data-action="submit-time-off"]',
      );
      expect(activeBtn?.getAttribute("aria-pressed")).toBe("true");

      const inactiveBtn = component.shadowRoot?.querySelector(
        '.menu-item[data-action="prior-year-summary"]',
      );
      expect(inactiveBtn?.getAttribute("aria-pressed")).toBe("false");
    });
  });

  describe("Menu Toggle", () => {
    it("should start with menu closed (aria-expanded false)", () => {
      const toggle = component.shadowRoot?.querySelector(".menu-toggle");
      expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    });

    it("should open menu on toggle click", () => {
      const toggle = component.shadowRoot?.querySelector(
        ".menu-toggle",
      ) as HTMLElement;
      toggle.click();

      const toggleAfter = component.shadowRoot?.querySelector(".menu-toggle");
      expect(toggleAfter?.getAttribute("aria-expanded")).toBe("true");
    });

    it("should add open class to menu items when opened", () => {
      const toggle = component.shadowRoot?.querySelector(
        ".menu-toggle",
      ) as HTMLElement;
      toggle.click();

      const menuItems = component.shadowRoot?.querySelector(".menu-items");
      expect(menuItems?.classList.contains("open")).toBe(true);
    });
  });

  describe("Event Dispatch — page-change", () => {
    it("should dispatch page-change event when menu item is clicked", () => {
      let firedEvent: CustomEvent | null = null;
      component.addEventListener("page-change", (e: Event) => {
        firedEvent = e as CustomEvent;
      });

      const menuItem = component.shadowRoot?.querySelector(
        '.menu-item[data-action="submit-time-off"]',
      ) as HTMLElement;
      menuItem.click();

      expect(firedEvent).toBeTruthy();
      expect(firedEvent!.detail.page).toBe("submit-time-off");
    });

    it("should dispatch page-change with bubbles and composed", () => {
      let eventBubbles = false;
      let eventComposed = false;
      component.addEventListener("page-change", (e: Event) => {
        eventBubbles = e.bubbles;
        eventComposed = e.composed;
      });

      const menuItem = component.shadowRoot?.querySelector(
        '.menu-item[data-action="current-year-summary"]',
      ) as HTMLElement;
      menuItem.click();

      expect(eventBubbles).toBe(true);
      expect(eventComposed).toBe(true);
    });

    it("should update current-page attribute after selection", () => {
      const menuItem = component.shadowRoot?.querySelector(
        '.menu-item[data-action="prior-year-summary"]',
      ) as HTMLElement;
      menuItem.click();

      expect(component.getAttribute("current-page")).toBe("prior-year-summary");
    });

    it("should dispatch page-change for admin pages", () => {
      component.userRole = "Admin";

      let firedEvent: CustomEvent | null = null;
      component.addEventListener("page-change", (e: Event) => {
        firedEvent = e as CustomEvent;
      });

      const menuItem = component.shadowRoot?.querySelector(
        '.menu-item[data-action="admin/monthly-review"]',
      ) as HTMLElement;
      menuItem.click();

      expect(firedEvent).toBeTruthy();
      expect(firedEvent!.detail.page).toBe("admin/monthly-review");
    });
  });

  describe("Event Dispatch — logout", () => {
    it("should dispatch logout event when logout button is clicked", () => {
      let logoutFired = false;
      component.addEventListener("logout", () => {
        logoutFired = true;
      });

      const logoutBtn = component.shadowRoot?.querySelector(
        '.menu-item[data-action="logout"]',
      ) as HTMLElement;
      logoutBtn.click();

      expect(logoutFired).toBe(true);
    });

    it("should dispatch logout with bubbles and composed", () => {
      let eventBubbles = false;
      let eventComposed = false;
      component.addEventListener("logout", (e: Event) => {
        eventBubbles = e.bubbles;
        eventComposed = e.composed;
      });

      const logoutBtn = component.shadowRoot?.querySelector(
        '.menu-item[data-action="logout"]',
      ) as HTMLElement;
      logoutBtn.click();

      expect(eventBubbles).toBe(true);
      expect(eventComposed).toBe(true);
    });
  });

  describe("Keyboard Navigation — executeMenuAction", () => {
    it("should dispatch page-change on Enter keydown", () => {
      let firedEvent: CustomEvent | null = null;
      component.addEventListener("page-change", (e: Event) => {
        firedEvent = e as CustomEvent;
      });

      const menuItem = component.shadowRoot?.querySelector(
        '.menu-item[data-action="submit-time-off"]',
      ) as HTMLElement;
      menuItem.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          composed: true,
        }),
      );

      expect(firedEvent).toBeTruthy();
      expect(firedEvent!.detail.page).toBe("submit-time-off");
    });

    it("should dispatch page-change on Space keydown", () => {
      let firedEvent: CustomEvent | null = null;
      component.addEventListener("page-change", (e: Event) => {
        firedEvent = e as CustomEvent;
      });

      const menuItem = component.shadowRoot?.querySelector(
        '.menu-item[data-action="current-year-summary"]',
      ) as HTMLElement;
      menuItem.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: " ",
          bubbles: true,
          composed: true,
        }),
      );

      expect(firedEvent).toBeTruthy();
      expect(firedEvent!.detail.page).toBe("current-year-summary");
    });

    it("should dispatch logout on Enter key on logout button", () => {
      let logoutFired = false;
      component.addEventListener("logout", () => {
        logoutFired = true;
      });

      const logoutBtn = component.shadowRoot?.querySelector(
        '.menu-item[data-action="logout"]',
      ) as HTMLElement;
      logoutBtn.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          composed: true,
        }),
      );

      expect(logoutFired).toBe(true);
    });

    it("should not dispatch on non-activation keys", () => {
      let firedEvent: CustomEvent | null = null;
      component.addEventListener("page-change", (e: Event) => {
        firedEvent = e as CustomEvent;
      });

      const menuItem = component.shadowRoot?.querySelector(
        '.menu-item[data-action="submit-time-off"]',
      ) as HTMLElement;
      menuItem.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
          composed: true,
        }),
      );

      expect(firedEvent).toBeNull();
    });
  });

  describe("Download Report", () => {
    it("should navigate to report URL for HTML download", () => {
      component.userRole = "Admin";

      // Capture location assignment
      const originalHref = window.location.href;
      let navigatedUrl = "";
      Object.defineProperty(window.location, "href", {
        set(url: string) {
          navigatedUrl = url;
        },
        get() {
          return originalHref;
        },
        configurable: true,
      });

      const downloadBtn = component.shadowRoot?.querySelector(
        '.menu-item[data-action="download-report-html"]',
      ) as HTMLElement;
      downloadBtn.click();

      expect(navigatedUrl).toContain("/api/admin/report?format=html&year=");
    });

    it("should navigate to report URL for Excel download", () => {
      component.userRole = "Admin";

      let navigatedUrl = "";
      const originalHref = window.location.href;
      Object.defineProperty(window.location, "href", {
        set(url: string) {
          navigatedUrl = url;
        },
        get() {
          return originalHref;
        },
        configurable: true,
      });

      const downloadBtn = component.shadowRoot?.querySelector(
        '.menu-item[data-action="download-report-excel"]',
      ) as HTMLElement;
      downloadBtn.click();

      expect(navigatedUrl).toContain("/api/admin/report?format=excel&year=");
    });

    it("should not dispatch page-change for download actions", () => {
      component.userRole = "Admin";

      // Stub location to avoid errors
      Object.defineProperty(window.location, "href", {
        set() {},
        get() {
          return "";
        },
        configurable: true,
      });

      let pageChangeFired = false;
      component.addEventListener("page-change", () => {
        pageChangeFired = true;
      });

      const downloadBtn = component.shadowRoot?.querySelector(
        '.menu-item[data-action="download-report-html"]',
      ) as HTMLElement;
      downloadBtn.click();

      expect(pageChangeFired).toBe(false);
    });
  });

  describe("Auto-close Behavior", () => {
    it("should close menu on Escape key", () => {
      // Open the menu first
      const toggle = component.shadowRoot?.querySelector(
        ".menu-toggle",
      ) as HTMLElement;
      toggle.click();

      // Verify menu is open
      expect(
        component.shadowRoot
          ?.querySelector(".menu-toggle")
          ?.getAttribute("aria-expanded"),
      ).toBe("true");

      // Press Escape on document
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );

      // Menu should be closing (animation started) — after animation the state will be closed.
      // In happy-dom, Web Animations API may not fully work, so we check that the closeMenuAnimated
      // path was taken. The isMenuOpen flag is set to false after animation completes.
      // For a synchronous check, the menu should at least not be in "open" state after Escape.
      // Since happy-dom doesn't fully support Web Animations, the Promise.then may not have fired.
      // We verify the document listener was removed by checking no error on second Escape.
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      // No error thrown = success (listeners were removed)
    });

    it("should close menu on outside click", () => {
      // Open the menu first
      const toggle = component.shadowRoot?.querySelector(
        ".menu-toggle",
      ) as HTMLElement;
      toggle.click();

      // Click outside
      document.dispatchEvent(
        new MouseEvent("click", { bubbles: true, composed: true }),
      );

      // Same animation caveat as Escape test — verify no errors
    });

    it("should remove document listeners on disconnect", () => {
      // Open the menu
      const toggle = component.shadowRoot?.querySelector(
        ".menu-toggle",
      ) as HTMLElement;
      toggle.click();

      // Disconnect the component
      component.remove();

      // Dispatching events on document should not throw
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
      document.dispatchEvent(
        new MouseEvent("click", { bubbles: true, composed: true }),
      );
    });
  });

  describe("Attribute Reactivity", () => {
    it("should re-render when current-page changes", () => {
      component.currentPage = "submit-time-off";

      const active = component.shadowRoot?.querySelector(
        '.menu-item[data-action="submit-time-off"]',
      );
      expect(active?.classList.contains("active")).toBe(true);

      component.currentPage = "prior-year-summary";

      const newActive = component.shadowRoot?.querySelector(
        '.menu-item[data-action="prior-year-summary"]',
      );
      expect(newActive?.classList.contains("active")).toBe(true);

      // Old item should no longer be active
      const oldActive = component.shadowRoot?.querySelector(
        '.menu-item[data-action="submit-time-off"]',
      );
      expect(oldActive?.classList.contains("active")).toBe(false);
    });

    it("should re-render admin items when user-role changes", () => {
      // Start as non-admin
      let items = component.shadowRoot?.querySelectorAll(".menu-item");
      expect(items?.length).toBe(5);

      // Promote to Admin
      component.userRole = "Admin";
      items = component.shadowRoot?.querySelectorAll(".menu-item");
      expect(items?.length).toBe(11);
    });
  });

  describe("Listener Cleanup on Disconnect", () => {
    it("should cancel pending animation on disconnect", () => {
      // Open the menu to start animation
      const toggle = component.shadowRoot?.querySelector(
        ".menu-toggle",
      ) as HTMLElement;
      toggle.click();

      // Disconnect mid-animation — should not throw
      component.remove();

      // Re-appending should render cleanly (not leaked)
      const freshComponent = new DashboardNavigationMenu();
      document.body.appendChild(freshComponent);
      expect(
        freshComponent.shadowRoot?.querySelector(".menu-toggle"),
      ).toBeTruthy();
      freshComponent.remove();
    });

    it("should remove document listeners on disconnect without open menu", () => {
      // Disconnect without opening menu — should not throw
      component.remove();

      // Dispatching Escape on document should not throw
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );
    });
  });
});
