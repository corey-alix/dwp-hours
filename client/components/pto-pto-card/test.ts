import { querySingle } from "../test-utils.js";
import { PtoPtoCard } from "./index.js";
import { seedPTOEntries } from "../../../shared/seedData.js";

export function playground() {
  console.log("Starting Scheduled Time Off Card test...");

  const card = querySingle<PtoPtoCard>("pto-pto-card");

  // Build full PTOEntry objects for all types (employee 1, 2026 data)
  const allEntries = seedPTOEntries
    .filter((e) => e.employee_id === 1 && e.date.startsWith("2026"))
    .map((seedEntry, index) => ({
      id: index + 1,
      employeeId: seedEntry.employee_id,
      date: seedEntry.date,
      type: seedEntry.type,
      hours: seedEntry.hours,
      createdAt: "2026-01-01T00:00:00.000Z",
      approved_by: seedEntry.approved_by,
    }));

  card.fullPtoEntries = allEntries;

  querySingle("#test-output").textContent =
    `Loaded ${allEntries.length} entries across all PTO types.`;

  // Test toggle functionality
  const toggleButton = card.shadowRoot?.querySelector(
    ".toggle-button",
  ) as HTMLButtonElement;
  if (toggleButton) {
    console.log("Toggle button found, clicking...");
    toggleButton.click();

    // Check expansion state
    const isExpanded = card.getAttribute("expanded") === "true";
    console.log("Card expanded after click:", isExpanded);

    // Verify table has rows for multiple types
    const rows = card.shadowRoot?.querySelectorAll(".entry-table tbody tr");
    console.log("Table rows:", rows?.length);

    // Test clickable date
    const dateElement = card.shadowRoot?.querySelector(
      ".usage-date",
    ) as HTMLSpanElement;
    if (dateElement) {
      console.log("Clickable date found, testing click...");
      let eventFired = false;
      card.addEventListener("navigate-to-month", () => {
        eventFired = true;
        console.log("navigate-to-month event fired!");
      });

      dateElement.click();
      console.log("Event fired after date click:", eventFired);
      querySingle("#test-output").textContent +=
        ` Toggle and date click tests completed. ${rows?.length} rows rendered.`;
    } else {
      console.log("No clickable date found");
      querySingle("#test-output").textContent += " Toggle test completed.";
    }
  } else {
    console.log("No toggle button found - checking if entries were set");
    querySingle("#test-output").textContent += " No entries to display toggle.";
  }
}
