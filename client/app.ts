// ensures components are registered and available for use in the UI
import "./components/index.js";

// Re-export playground for testing
export { TestWorkflow, initTestPage } from "./test.js";
export * from "./components/test.js";

// Import controller architecture
import { TraceListener } from "./controller/TraceListener.js";
import { PtoNotificationController } from "./controller/PtoNotificationController.js";
import { DebugConsoleController } from "./controller/DebugConsoleController.js";
import { UIManager } from "./UIManager.js";

// Notification system — TraceListener replaces the old NotificationManager.
// The variable name `notifications` is retained for call-site compatibility.
export const notifications = new TraceListener();

/**
 * Application entry point.
 * Call `App.run()` after the DOM is fully parsed to bootstrap the UI.
 */
export class App {
  static run(): UIManager {
    // Register output-channel controllers
    notifications.addListener(new PtoNotificationController());
    notifications.addListener(new DebugConsoleController());

    return new UIManager();
  }
}

function setupResponsiveScaling() {
  const updateScale = () => {
    const scale = Math.min(1, window.innerWidth / 320);
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
