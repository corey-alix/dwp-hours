import { querySingle } from "../test-utils.js";
import { PtoBereavementCard } from "./index.js";
import { seedPTOEntries } from "../../../shared/seedData.js";

export function playground() {
  console.log("Starting PTO Bereavement Card test...");

  const card = querySingle<PtoBereavementCard>("pto-bereavement-card");

  // Compute bucket data from seedData
  const approvedBereavementEntries = seedPTOEntries.filter(
    (e) =>
      e.employee_id === 1 && e.approved_by !== null && e.type === "Bereavement",
  );
  const usedBereavement = approvedBereavementEntries.reduce(
    (sum, e) => sum + e.hours,
    0,
  );
  const allowedBereavement = 40; // Business rule constant

  card.bucket = {
    allowed: allowedBereavement,
    used: usedBereavement,
    remaining: allowedBereavement - usedBereavement,
  };

  // Set usage entries for display
  card.usageEntries = approvedBereavementEntries.map((e) => ({
    date: e.date,
    hours: e.hours,
  }));

  // Set full PTO entries for approval testing
  const allBereavementEntries = seedPTOEntries
    .filter((e) => e.employee_id === 1 && e.type === "Bereavement")
    .map((seedEntry, index) => ({
      id: index + 1,
      employeeId: seedEntry.employee_id,
      date: seedEntry.date,
      type: seedEntry.type,
      hours: seedEntry.hours,
      createdAt: "2025-01-01T00:00:00.000Z",
      approved_by: seedEntry.approved_by,
    }));
  card.fullPtoEntries = allBereavementEntries;

  querySingle("#test-output").textContent = "Bereavement data set with usage.";

  // Test toggle functionality - check if toggle button exists
  const toggleButton = card.shadowRoot?.querySelector(
    ".toggle-button",
  ) as HTMLButtonElement;
  if (toggleButton) {
    console.log("Toggle button found, clicking...");
    toggleButton.click();

    // Check expansion state
    const isExpanded = card.getAttribute("expanded") === "true";
    console.log("Card expanded after click:", isExpanded);

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
        " Toggle and date click tests completed.";
    } else {
      console.log("No clickable date found");
      querySingle("#test-output").textContent += " Toggle test completed.";
    }
  } else {
    console.log("No toggle button found - checking if entries were set");
    // If no toggle button, the test should still complete
    querySingle("#test-output").textContent += " No entries to test.";
  }
}
