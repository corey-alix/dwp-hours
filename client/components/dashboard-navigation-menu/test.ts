import { querySingle } from "../test-utils.js";
import { DashboardNavigationMenu } from "./index.js";

export function playground() {
  console.log("Starting Dashboard Navigation Menu playground test...");

  const menu = querySingle<DashboardNavigationMenu>(
    "#dashboard-navigation-menu",
  );

  // Test initial state
  console.log("Initial current page:", menu.currentPage);
  console.log("Initial menu open state:", (menu as any).isMenuOpen);

  // Test menu toggle functionality
  console.log("Testing menu toggle...");
  const toggleButton = menu.shadowRoot?.querySelector(
    ".menu-toggle",
  ) as HTMLButtonElement;
  if (toggleButton) {
    // Test opening menu
    toggleButton.click();
    console.log(
      "After first click (should be open):",
      (menu as any).isMenuOpen,
    );

    // Test closing menu
    toggleButton.click();
    console.log(
      "After second click (should be closed):",
      (menu as any).isMenuOpen,
    );
  } else {
    console.log("Toggle button not found");
  }

  // Test setting page
  menu.currentPageValue = "current-year-summary";
  console.log("Set to current-year-summary:", menu.currentPage);

  // Test event dispatching
  menu.addEventListener("page-change", (e) => {
    const customEvent = e as CustomEvent;
    console.log("Page change event:", customEvent.detail);
  });

  menu.addEventListener("logout", () => {
    console.log("Logout event fired");
  });

  // Test logout functionality
  console.log("Testing logout...");
  const logoutButton = menu.shadowRoot?.querySelector(
    ".menu-item.logout",
  ) as HTMLButtonElement;
  if (logoutButton) {
    logoutButton.click();
    console.log("Logout button clicked");
  } else {
    console.log("Logout button not found");
  }

  // Simulate clicks (in real test, would use click events)
  console.log("Menu component initialized and ready for interaction testing");
}
