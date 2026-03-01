import { querySingle } from "../../components/test-utils.js";

export function playground() {
  console.log("Starting Admin Monthly Review Page playground test...");

  const page = document.createElement("admin-monthly-review-page") as any;
  document.body.appendChild(page);

  page.onRouteEnter({}, new URLSearchParams());

  querySingle("#test-output").textContent =
    "Admin Monthly Review page rendered";

  console.log("Admin Monthly Review Page playground test initialized");
}
