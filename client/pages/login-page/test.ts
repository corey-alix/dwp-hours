import { querySingle } from "../../components/test-utils.js";

export function playground() {
  console.log("Starting Login Page playground test...");

  const page = document.createElement("login-page");
  document.body.appendChild(page);

  // Listen for login-success events
  page.addEventListener("login-success", ((e: CustomEvent) => {
    console.log("Login success:", e.detail);
    querySingle("#test-output").textContent =
      `Login success: ${JSON.stringify(e.detail)}`;
  }) as EventListener);

  console.log("Login Page playground test initialized");
}
