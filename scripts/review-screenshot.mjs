import { chromium } from "playwright";
import { writeFileSync } from "fs";
import { basename } from "path";

// ── CLI usage ──────────────────────────────────────────────────
// node scripts/review-screenshot.mjs <route> [user] [component]
//
// Examples:
//   node scripts/review-screenshot.mjs /admin/monthly-review
//   node scripts/review-screenshot.mjs /current-year-summary john.doe@example.com
//   node scripts/review-screenshot.mjs /submit-time-off john.doe@example.com submit-time-off-page
//
// Environment variables:
//   PORT  — server port (default: 3003)
//
// Output:
//   /tmp/<slug>.png          — full-page screenshot
//   /tmp/<slug>-shadow.html  — extracted shadow DOM HTML

const route = process.argv[2] || "/admin/monthly-review";
const user = process.argv[3] || "admin@example.com";

// Derive component tag from route: /admin/monthly-review → admin-monthly-review-page
const defaultComponent =
  route
    .replace(/^\//, "")
    .replace(/\//g, "-")
    .replace(/\?.*$/, "") + "-page";
const component = process.argv[4] || defaultComponent;

// Derive output file slug from route: /admin/monthly-review → admin-monthly-review
const slug = route
  .replace(/^\//, "")
  .replace(/\//g, "-")
  .replace(/\?.*$/, "");
const outPng = `/tmp/${slug}.png`;
const outHtml = `/tmp/${slug}-shadow.html`;

const PORT = process.env.PORT || "3003";
const BASE = `http://localhost:${PORT}`;

console.log(`Route:     ${route}`);
console.log(`User:      ${user}`);
console.log(`Component: ${component}`);
console.log(`Output:    ${outPng}, ${outHtml}`);
console.log();

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  colorScheme: "dark",
});
const page = await context.newPage();

// Step 1: Get magic link via API
const resp = await page.request.post(`${BASE}/api/auth/request-link`, {
  data: { identifier: user },
  headers: { "Content-Type": "application/json" },
});
const body = await resp.json();
console.log("Login API response:", JSON.stringify(body));

if (!body.magicLink) {
  console.error("No magic link returned. Server may be in production mode.");
  await browser.close();
  process.exit(1);
}

// Step 2: Follow the magic link to validate token and set cookie
await page.goto(body.magicLink);
await page.waitForTimeout(2000);
console.log("After magic link, URL:", page.url());

// Step 3: Navigate to the target route
await page.goto(`${BASE}${route}`);
await page.waitForTimeout(3000);
console.log("Current URL:", page.url());

// Step 4: Screenshot
await page.screenshot({ path: outPng, fullPage: true });
console.log(`Screenshot saved to ${outPng}`);

// Step 5: Get shadow DOM content from the page component and its children
const shadowHTML = await page.evaluate((comp) => {
  function extractShadow(el, depth) {
    if (depth > 6 || !el) return "";
    let html = "";
    if (el.shadowRoot) {
      html += el.shadowRoot.innerHTML;
      el.shadowRoot.querySelectorAll("*").forEach((child) => {
        if (child.shadowRoot) {
          html += "\n<!-- SHADOW: " + child.tagName + " -->\n";
          html += extractShadow(child, depth + 1);
        }
      });
    }
    return html;
  }
  const root = document.querySelector(comp);
  if (!root)
    return (
      "No " +
      comp +
      " found. Body: " +
      document.body.innerHTML.substring(0, 2000)
    );
  return extractShadow(root, 0);
}, component);
writeFileSync(outHtml, shadowHTML);
console.log("Shadow DOM saved (" + shadowHTML.length + " chars)");
console.log("Preview:", shadowHTML.substring(0, 1500));

await browser.close();
