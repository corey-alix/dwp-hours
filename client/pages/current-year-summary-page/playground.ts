import { querySingle } from "../../components/test-utils.js";

export function playground() {
  console.log("Starting Current Year Summary Page playground test...");

  const page = document.createElement("current-year-summary-page");
  document.body.appendChild(page);

  // Listen for navigate-to-month events
  page.addEventListener("navigate-to-month", ((e: CustomEvent) => {
    console.log("Navigate to month:", e.detail);
    querySingle("#test-output").textContent =
      `Navigate to month: ${JSON.stringify(e.detail)}`;
  }) as EventListener);

  querySingle("#test-output").textContent =
    "Current Year Summary page rendered (no loader data)";

  console.log("Current Year Summary Page playground test initialized");
}
