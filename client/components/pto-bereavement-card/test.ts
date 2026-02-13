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

  // Sample usage entries from seedData
  card.usageEntries = approvedBereavementEntries.map((e) => ({
    date: e.date,
    hours: e.hours,
  }));

  querySingle("#test-output").textContent = "Bereavement data set with usage.";

  // Test toggle functionality
  setTimeout(() => {
    console.log("Testing toggle functionality...");
    const toggleButton = card.shadowRoot?.querySelector(
      ".toggle-button",
    ) as HTMLButtonElement;
    if (toggleButton) {
      console.log("Toggle button found, clicking...");
      toggleButton.click();

      setTimeout(() => {
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

          setTimeout(() => {
            console.log("Event fired after date click:", eventFired);
            querySingle("#test-output").textContent +=
              " Toggle and date click tests completed.";
          }, 100);
        } else {
          console.log("No clickable date found");
          querySingle("#test-output").textContent += " Toggle test completed.";
        }
      }, 100);
    } else {
      console.log("No toggle button found");
    }
  }, 100);
}
