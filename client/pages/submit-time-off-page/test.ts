import { querySingle } from "../../components/test-utils.js";

export function playground() {
  console.log("Starting Submit Time Off Page playground test...");

  const page = document.createElement("submit-time-off-page");
  document.body.appendChild(page);

  querySingle("#test-output").textContent =
    "Submit Time Off page rendered (no loader data)";

  console.log("Submit Time Off Page playground test initialized");
}
