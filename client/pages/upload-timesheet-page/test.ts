import { querySingle } from "../../components/test-utils.js";

export function playground() {
  console.log("Starting Upload Timesheet Page playground test...");

  const page = document.createElement("upload-timesheet-page");
  document.body.appendChild(page);

  querySingle("#test-output").textContent =
    "Upload Timesheet page rendered (no profile data)";

  console.log("Upload Timesheet Page playground test initialized");
}
