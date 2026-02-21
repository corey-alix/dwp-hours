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

test("index PTO calendar edit existing entry submits 8 hours", async ({
  page,
}) => {
  test.setTimeout(15000);

  await page.goto("/login");

  // Log in as John Doe (who has the 80-hour PTO entry for 2026-07-01)
  const loginPage = page.locator("login-page");
  await expect(loginPage).toBeVisible();
  await loginPage.locator("#identifier").fill("john.doe@example.com");
  await loginPage.locator('#login-form button[type="submit"]').click();

  // Dev mode auto-validates the magic link token and navigates to /submit-time-off
  await page.waitForURL(/\/submit-time-off/, { timeout: 10000 });

  // Navigate to Current Year Summary via nav menu
  const menu = page.locator("dashboard-navigation-menu");
  const menuToggle = menu.locator("button.menu-toggle");
  await expect(menuToggle).toBeVisible();
  await menuToggle.click();
  const currentYearBtn = menu.locator(
    'button[data-action="current-year-summary"]',
  );
  await currentYearBtn.click();

  // Wait for Current Year Summary page to render
  await page.waitForURL(/\/current-year-summary/);
  const summaryPage = page.locator("current-year-summary-page");
  await expect(summaryPage).toBeVisible();

  // Wait for PTO status to load
  await page.waitForTimeout(5000);

  // Open navigation menu and click "Submit Time Off"
  await menuToggle.click();
  await page.click(
    'dashboard-navigation-menu .menu-item[data-action="submit-time-off"]',
  );

  await page.waitForURL(/\/submit-time-off/);
  const timeOffPage = page.locator("submit-time-off-page");
  await expect(timeOffPage).toBeVisible();

  const form = timeOffPage.locator("pto-entry-form");
  await expect(form).toBeVisible();

  // Set start date to July 2026 to show July calendar
  const startDate = form.locator("#start-date");
  await startDate.fill("2026-07-01");
  await startDate.blur();

  // Toggle to calendar view
  await form.locator("#calendar-toggle-btn").click();
  const calendarView = form.locator("#calendar-view");
  await expect(calendarView).not.toHaveClass(/hidden/);
  const calendar = form.locator("pto-calendar");
  await expect(calendar).toBeVisible();

  // Wait for calendar to load and show July 2026
  await page.waitForTimeout(2000);

  // Manually set PTO entries on the calendar for testing and ensure July is displayed
  await page.evaluate(() => {
    const pageEl = document.querySelector("submit-time-off-page") as any;
    const form = pageEl?.shadowRoot?.querySelector("pto-entry-form") as any;
    if (form && form.shadowRoot) {
      const calendar = form.shadowRoot.querySelector("pto-calendar") as any;
      if (calendar) {
        calendar.setAttribute("month", "7");
        calendar.setAttribute("year", "2026");
        calendar.setAttribute("readonly", "false");
        calendar.ptoEntries = [
          {
            id: 1,
            employeeId: 1,
            date: "2026-07-01",
            type: "PTO",
            hours: 8,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ];
      }
    }
  });

  // Wait for the calendar to re-render
  await page.waitForTimeout(500);

  // Check that the July 1st cell exists and has PTO
  const july1stCell = calendar.locator('[data-date="2026-07-01"]');
  await expect(july1stCell).toBeVisible();
  await expect(july1stCell).toHaveClass(/has-pto/);

  // Click the cell to select it for editing (click-to-cycle: sets to existing hours first)
  await page.evaluate(() => {
    const pageEl = document.querySelector("submit-time-off-page") as any;
    const form = pageEl?.shadowRoot?.querySelector("pto-entry-form") as any;
    const calendar = form.shadowRoot.querySelector("pto-calendar") as any;
    const cell = calendar.shadowRoot.querySelector(
      '.day[data-date="2026-07-01"]',
    ) as HTMLElement;
    cell.click();
  });

  // Wait for the render to complete
  await page.waitForTimeout(500);

  // Cell should now be selected
  await expect(july1stCell).toHaveClass(/selected/);
  // Full day indicator (8 hours = ●)
  await expect(july1stCell.locator(".hours")).toContainText("●");

  // Click the submit button to submit the selected entry
  const [ptoResponse] = await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes("/api/pto") &&
        response.request().method() === "POST",
      { timeout: 5000 },
    ),
    form.locator("#submit-btn").click(),
  ]);

  // The request should succeed
  expect(ptoResponse.status()).toBe(201);
  const responseBody = await ptoResponse.json();
  expect(responseBody).toHaveProperty("message");
  expect(responseBody.message).toContain("processed successfully");

  // Verify the entry was updated in the database
  const entries = await page.evaluate(async () => {
    const response = await fetch("/api/pto");
    return response.json();
  });

  expect(Array.isArray(entries)).toBe(true);
  const july1stEntry = entries.find(
    (entry: { date: string; type: string; hours: number }) =>
      entry.date === "2026-07-01" && entry.type === "PTO",
  );
  expect(july1stEntry).toBeTruthy();
  expect(july1stEntry.hours).toBe(8);

  // Should show success notification
  await expect(page.locator("pto-notification .toast.success")).toBeVisible();
});
