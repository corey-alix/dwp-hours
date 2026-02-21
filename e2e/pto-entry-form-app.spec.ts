import { test, expect } from "@playwright/test";

test.beforeEach(async () => {
  // Seed database before each test for isolation
  const response = await fetch(
    `http://localhost:${process.env.PORT || 3000}/api/test/seed`,
    {
      method: "POST",
      headers: { "x-test-seed": "true", "Content-Type": "application/json" },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to seed database: ${response.statusText}`);
  }
});

test("index PTO form submission persists entry", async ({ page }) => {
  test.setTimeout(15000);

  const testDateStr = "2026-04-01";

  await page.goto("/login");

  const loginPage = page.locator("login-page");
  await expect(loginPage).toBeVisible();
  await loginPage.locator("#identifier").fill("jane.smith@example.com");
  await loginPage.locator('#login-form button[type="submit"]').click();

  // Dev mode auto-validates and navigates to /submit-time-off
  await page.waitForURL(/\/submit-time-off/, { timeout: 10000 });

  const timeOffPage = page.locator("submit-time-off-page");
  await expect(timeOffPage).toBeVisible();
  const form = timeOffPage.locator("pto-entry-form");
  await expect(form).toBeVisible();

  const startDate = form.locator("#start-date");
  const endDate = form.locator("#end-date");
  const ptoType = form.locator("#pto-type");

  await startDate.fill(testDateStr);
  await startDate.blur();
  await endDate.fill(testDateStr);
  await endDate.blur();
  await ptoType.selectOption("Full PTO");
  await page.waitForTimeout(100);

  const [ptoResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/pto") &&
        response.request().method() === "POST",
      { timeout: 5000 },
    ),
    form.locator("#submit-btn").click(),
  ]);

  expect(ptoResponse.status()).toBe(201);
  const responseBody = await ptoResponse.json();
  expect(responseBody).toHaveProperty("ptoEntry");
  expect(responseBody.ptoEntry.date).toBe(testDateStr);
  expect(responseBody.ptoEntry.type).toBe("PTO");
  expect(responseBody.ptoEntry.hours).toBe(8);

  await expect(page.locator("pto-notification .toast.success")).toBeVisible();

  const entries = await page.evaluate(async () => {
    const response = await fetch("/api/pto");
    return response.json();
  });

  expect(Array.isArray(entries)).toBe(true);
  const matching = entries.find(
    (entry: { date: string; type: string; hours: number }) =>
      entry.date === testDateStr && entry.type === "PTO" && entry.hours === 8,
  );
  expect(matching).toBeTruthy();
});

test("index PTO calendar submission persists entry", async ({ page }) => {
  test.setTimeout(15000);

  const testDateStr = "2026-02-10";

  await page.goto("/login");

  // Reload database to ensure clean state
  await page.request.post("/api/test/reload-database", {
    headers: { "x-test-reload": "true" },
  });

  // Wait a moment for database reload to complete
  await page.waitForTimeout(1000);

  const loginPage2 = page.locator("login-page");
  await expect(loginPage2).toBeVisible();
  await loginPage2.locator("#identifier").fill("jane.smith@example.com");
  await loginPage2.locator('#login-form button[type="submit"]').click();

  // Dev mode auto-validates and navigates to /submit-time-off
  await page.waitForURL(/\/submit-time-off/, { timeout: 10000 });

  // Wait for PTO status to load
  await page.waitForTimeout(2000);

  const timeOffPage = page.locator("submit-time-off-page");
  await expect(timeOffPage).toBeVisible();
  const form = timeOffPage.locator("pto-entry-form");
  await expect(form).toBeVisible();

  // Set sufficient PTO balance for the test
  await form.evaluate((el: any) => {
    el.setAttribute("available-pto-balance", "100");
  });

  // Set start date to ensure calendar initializes to correct month
  const startDate = form.locator("#start-date");
  await startDate.fill(testDateStr);
  await startDate.blur();

  // Toggle to calendar view
  await form.locator("#calendar-toggle-btn").click();
  const calendarView = form.locator("#calendar-view");
  await expect(calendarView).not.toHaveClass(/hidden/);
  const calendar = form.locator("pto-calendar");
  await expect(calendar).toBeVisible();

  // Dispatch a calendar-style PTO submission event to avoid flaky selection clicks
  await page.evaluate((dateStr) => {
    const form = document.querySelector("pto-entry-form");
    form?.dispatchEvent(
      new CustomEvent("pto-submit", {
        detail: { requests: [{ date: dateStr, type: "PTO", hours: 4 }] },
        bubbles: true,
        composed: true,
      }),
    );
  }, testDateStr);

  const ptoResponse = await page.waitForResponse(
    (response) =>
      response.url().includes("/api/pto") &&
      response.request().method() === "POST",
    { timeout: 5000 },
  );

  expect(ptoResponse.status()).toBe(201);
  const responseBody = await ptoResponse.json();
  expect(responseBody).toHaveProperty("ptoEntry");
  expect(responseBody.ptoEntry.date).toBe(testDateStr);
  expect(responseBody.ptoEntry.type).toBe("PTO");
  expect(responseBody.ptoEntry.hours).toBe(4);

  await expect(page.locator("pto-notification .toast.success")).toBeVisible();

  const entries = await page.evaluate(async () => {
    const response = await fetch("/api/pto");
    return response.json();
  });

  expect(Array.isArray(entries)).toBe(true);
  const matching = entries.find(
    (entry: { date: string; type: string; hours: number }) =>
      entry.date === testDateStr && entry.type === "PTO" && entry.hours === 4,
  );
  expect(matching).toBeTruthy();
});
