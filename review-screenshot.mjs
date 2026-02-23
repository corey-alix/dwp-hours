import { chromium } from "playwright";
import { writeFileSync } from "fs";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  colorScheme: "dark",
});
const page = await context.newPage();

// Step 1: Get magic link via API
const resp = await page.request.post(
  "http://localhost:3003/api/auth/request-link",
  {
    data: { identifier: "admin@example.com" },
    headers: { "Content-Type": "application/json" },
  },
);
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

// Step 3: Navigate to admin monthly review
await page.goto("http://localhost:3003/admin/monthly-review");
await page.waitForTimeout(3000);
console.log("Current URL:", page.url());

// Step 4: Screenshot
await page.screenshot({ path: "/tmp/monthly-review.png", fullPage: true });
console.log("Screenshot saved to /tmp/monthly-review.png");

// Step 5: Get shadow DOM content from admin-monthly-review-page and its children
const shadowHTML = await page.evaluate(() => {
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
  const reviewPage = document.querySelector("admin-monthly-review-page");
  if (!reviewPage)
    return (
      "No admin-monthly-review-page found. Body: " +
      document.body.innerHTML.substring(0, 2000)
    );
  return extractShadow(reviewPage, 0);
});
writeFileSync("/tmp/monthly-review-shadow.html", shadowHTML);
console.log("Shadow DOM saved (" + shadowHTML.length + " chars)");
console.log("Preview:", shadowHTML.substring(0, 1500));

await browser.close();
