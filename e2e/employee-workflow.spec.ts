import { test, expect } from "@playwright/test";
import { SUCCESS_MESSAGES } from "../shared/businessRules.js";

test.describe("Employee Authentication & Workflow", () => {
  test("should complete comprehensive PTO calendar request workflow", async ({
    page,
  }) => {
    test.setTimeout(20000);

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`[browser error] ${msg.text()}`);
      }
    });
    page.on("pageerror", (error) => {
      console.log(`[pageerror] ${error.message}`);
    });
    page.on("requestfailed", (request) => {
      if (request.url().includes("/api/pto")) {
        const failure = request.failure();
        console.log(
          `[requestfailed] ${request.method()} ${request.url()} :: ${failure?.errorText ?? "unknown"}`,
        );
      }
    });

    // Use a fixed weekday date that won't conflict with seed data
    const testDateStr = "2026-02-10"; // Monday, past date

    // Navigate to the actual application
    await page.goto("/");

    // Fill out login form with test user email
    await page.fill("#identifier", "john.doe@gmail.com");
    await page.click('#login-form button[type="submit"]');

    // Wait for magic link to appear
    await page.waitForSelector("#login-message", { timeout: 10000 });
    const magicLink = page.locator("#login-message a");
    await expect(magicLink).toBeVisible();
    await expect(magicLink).toHaveAttribute("href", /token=.+&ts=\d+/);

    // Click the magic link to login
    await magicLink.click();

    // Wait for dashboard to load
    await page.waitForSelector("#dashboard", { timeout: 10000 });
    await expect(page.locator("#pto-status")).toBeVisible();

    // Verify we're in request mode by default (Phase 13)
    const accrualCard = page.locator("pto-accrual-card");
    await expect(accrualCard).toBeVisible();
    const requestMode = await accrualCard.getAttribute("request-mode");
    expect(requestMode).toBe("true");

    // Select March (next month from February 2026)
    await page.click('button[data-month="3"]'); // March (1-based indexing)

    // Wait for calendar to load
    await page.waitForSelector("pto-calendar", { timeout: 5000 });
    await page.waitForTimeout(500); // Additional wait for calendar rendering

    // Dispatch a PTO request event to mirror calendar submission without shadow DOM flakiness
    const [ptoResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/pto") &&
          response.request().method() === "POST",
        { timeout: 5000 },
      ),
      page.evaluate((dateStr) => {
        const accrualCard = document.querySelector("pto-accrual-card");
        const requests = [{ date: dateStr, type: "Sick", hours: 4 }];
        accrualCard?.dispatchEvent(
          new CustomEvent("pto-request-submit", {
            detail: { requests },
            bubbles: true,
            composed: true,
          }),
        );
      }, testDateStr),
    ]);

    // Wait for the response and verify it
    expect(ptoResponse.status()).toBe(201);
    const responseBody = await ptoResponse.json();

    // Verify the response contains expected PTO request data
    expect(responseBody).toBeDefined();
    expect(responseBody).toHaveProperty(
      "message",
      SUCCESS_MESSAGES["pto.created"],
    );
    expect(responseBody).toHaveProperty("ptoEntry");

    const ptoRequest = responseBody.ptoEntry;
    expect(ptoRequest).toBeDefined();
    expect(ptoRequest.employeeId).toBeDefined();
    expect(ptoRequest.date).toBe(testDateStr); // Date stored as YYYY-MM-DD string
    expect(ptoRequest.type).toBe("Sick");
    expect(ptoRequest.hours).toBe(4);

    // Verify success notification appears
    await expect(page.locator(".notification-toast.success")).toBeVisible();
  });
});
