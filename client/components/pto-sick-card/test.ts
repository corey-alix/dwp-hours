import { querySingle } from "../test-utils.js";
import { PtoSickCard } from "./index.js";

export function playground() {
  console.log("Starting PTO Sick Card test...");

  const card = querySingle<PtoSickCard>("pto-sick-card");

  // Sample bucket data
  card.bucket = {
    allowed: 80,
    used: 24,
    remaining: 56,
  };

  // Sample usage entries
  card.usageEntries = [
    { date: "2024-01-15", hours: 8 },
    { date: "2024-03-10", hours: 8 },
    { date: "2024-05-22", hours: 8 },
  ];

  querySingle("#test-output").textContent = "Sick time data set.";

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
