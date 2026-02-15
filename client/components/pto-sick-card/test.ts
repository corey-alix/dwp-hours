import { querySingle } from "../test-utils.js";
import { PtoSickCard } from "./index.js";
import { seedPTOEntries } from "../../../shared/seedData.js";

export function playground() {
  console.log("Starting PTO Sick Card test...");

  const card = querySingle<PtoSickCard>("pto-sick-card");
  // Compute bucket data from seedData
  const approvedSickEntries = seedPTOEntries.filter(
    (e) => e.employee_id === 1 && e.approved_by !== null && e.type === "Sick",
  );
  const usedSick = approvedSickEntries.reduce((sum, e) => sum + e.hours, 0);
  const allowedSick = 24; // Business rule constant

  card.bucket = {
    allowed: allowedSick,
    used: usedSick,
    remaining: allowedSick - usedSick,
  };

  // Set usage entries for display
  card.usageEntries = approvedSickEntries.map((e) => ({
    date: e.date,
    hours: e.hours,
  }));

  // Set full PTO entries for approval testing
  const allSickEntries = seedPTOEntries
    .filter((e) => e.employee_id === 1 && e.type === "Sick")
    .map((seedEntry, index) => ({
      id: index + 1,
      employeeId: seedEntry.employee_id,
      date: seedEntry.date,
      type: seedEntry.type,
      hours: seedEntry.hours,
      createdAt: "2025-01-01T00:00:00.000Z",
      approved_by: seedEntry.approved_by,
    }));
  card.fullPtoEntries = allSickEntries;
  // Set usage entries for display
  card.usageEntries = approvedSickEntries.map((e) => ({
    date: e.date,
    hours: e.hours,
  }));

  querySingle("#test-output").textContent = "Sick time data set.";

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

    // Test individual date approval indicators
    const approvedDates = card.shadowRoot?.querySelectorAll(
      ".usage-date.approved",
    );
    const unapprovedDates = card.shadowRoot?.querySelectorAll(
      ".usage-date:not(.approved)",
    );
    console.log(
      `Found ${approvedDates?.length || 0} approved dates and ${unapprovedDates?.length || 0} unapproved dates`,
    );

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
