import { querySingle } from "../../components/test-utils.js";

export function playground() {
  console.log("Starting Prior Year Summary Page playground test...");

  const page = document.createElement("prior-year-summary-page");
  document.body.appendChild(page);

  querySingle("#test-output").textContent =
    "Prior Year Summary page rendered (no loader data)";

  console.log("Prior Year Summary Page playground test initialized");
}
