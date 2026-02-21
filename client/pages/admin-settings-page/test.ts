import { querySingle } from "../../components/test-utils.js";

export function playground() {
  console.log("Starting Admin Settings Page playground test...");

  const page = document.createElement("admin-settings-page") as any;
  document.body.appendChild(page);

  page.onRouteEnter({}, new URLSearchParams());

  querySingle("#test-output").textContent = "Admin Settings page rendered";

  console.log("Admin Settings Page playground test initialized");
}
