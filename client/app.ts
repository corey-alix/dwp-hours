// ensures components are registered and available for use in the UI
import "./components/index.js";

// Re-export playground for testing
export { TestWorkflow, initTestPage } from "./test.js";
export * from "./components/test.js";
export * from "./pages/test.js";

// Import controller architecture
import { TraceListener } from "./controller/TraceListener.js";
import { PtoNotificationController } from "./controller/PtoNotificationController.js";
import { DebugConsoleController } from "./controller/DebugConsoleController.js";
import { UIManager } from "./UIManager.js";
import { createContextProvider, CONTEXT_KEYS } from "./shared/context.js";
import {
  setTimeTravelDay,
  isValidDateString,
  parseDate,
} from "../shared/dateUtils.js";

// ── Time-travel bootstrap ────────────────────────────────────────
// Read ?current_day=YYYY-MM-DD from the URL and activate the date override
// before any component renders. This is the sole entry point for client-side
// time-travel. All other modules observe the effect via today() / getCurrentYear().
(function initTimeTravel(): void {
  const params = new URLSearchParams(window.location.search);

  const dayStr = params.get("current_day");
  if (dayStr && isValidDateString(dayStr)) {
    const { year } = parseDate(dayStr);
    if (year >= 2000 && year <= 2099) {
      setTimeTravelDay(dayStr);
      // eslint-disable-next-line no-console
      console.info(`[time-travel] Active — reference day set to ${dayStr}`);
    }
  }
})();

// Notification system — TraceListener replaces the old NotificationManager.
// Module-scoped instance provided to UIManager via constructor injection
// and to DOM components via the context protocol.
const notifications = new TraceListener();

/**
 * Application entry point.
 * Call `App.run()` after the DOM is fully parsed to bootstrap the UI.
 */
export class App {
  static run(): UIManager {
    // Register output-channel controllers
    notifications.addListener(new PtoNotificationController());
    notifications.addListener(new DebugConsoleController());

    // Mount notifications context provider around the app wrapper
    // so any descendant can call consumeContext<TraceListener>(this, "notifications", cb)
    const appWrapper = document.getElementById("app-wrapper");
    if (appWrapper?.parentElement) {
      const provider = createContextProvider(
        CONTEXT_KEYS.NOTIFICATIONS,
        notifications,
      );
      provider.style.display = "contents"; // invisible wrapper
      appWrapper.parentElement.insertBefore(provider, appWrapper);
      provider.appendChild(appWrapper);
    }

    return new UIManager(notifications);
  }
}

function setupResponsiveScaling() {
  const updateScale = () => {
    const scale = 1;
    document.documentElement.style.setProperty(
      "--scale-factor",
      scale.toString(),
    );
  };

  // Set initial scale
  updateScale();

  // Update on resize
  window.addEventListener("resize", updateScale);
}

// Set up responsive scaling
setupResponsiveScaling();
