import { querySingle } from "../test-utils.js";

export function playground() {
  console.log("Starting Timesheet Upload Form playground test...");

  const form = document.createElement("timesheet-upload-form");
  document.body.appendChild(form);

  querySingle("#test-output").textContent =
    "Timesheet Upload Form rendered (no profile data)";

  console.log("Timesheet Upload Form playground test initialized");
}
