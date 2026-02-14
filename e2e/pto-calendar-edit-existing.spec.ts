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

test("index PTO calendar edit existing entry from 80 to 8 hours", async ({
  page,
}) => {
  test.setTimeout(15000);

  await page.goto("/");

  // Log in as John Doe (who has the 80-hour PTO entry for 2026-07-01)
  await page.fill("#identifier", "john.doe@gmail.com");
  await page.click('#login-form button[type="submit"]');

  await page.waitForSelector("#login-message a", { timeout: 10000 });
  const magicLink = page.locator("#login-message a");
  await expect(magicLink).toHaveAttribute("href", /token=.+&ts=\d+/);
  await magicLink.click();

  await page.waitForSelector("#dashboard", { timeout: 10000 });
  await expect(page.locator("#pto-status")).toBeVisible();

  // Wait for PTO status to load
  await page.waitForTimeout(5000);

  // Click "Request Time Off" button
  await page.click("#new-pto-btn");
  await expect(page.locator("#main-content > #pto-form")).not.toHaveClass(
    /hidden/,
  );

  const form = page.locator("pto-entry-form");
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

  // Manually set PTO entries on the calendar for testing
  await page.evaluate(() => {
    const form = document.querySelector("pto-entry-form") as any;
    if (form && form.shadowRoot) {
      const calendar = form.shadowRoot.querySelector("pto-calendar") as any;
      if (calendar) {
        calendar.setAttribute(
          "pto-entries",
          JSON.stringify([
            {
              id: 1,
              employeeId: 1,
              date: "2026-07-01",
              type: "PTO",
              hours: 80,
              createdAt: "2026-01-01T00:00:00.000Z",
            },
          ]),
        );
      }
    }
  });

  // Wait for the calendar to re-render
  await page.waitForTimeout(500);

  // Check that the July 1st cell exists and has PTO
  const july1stCell = calendar.locator('[data-date="2026-07-01"]');
  await expect(july1stCell).toBeVisible();
  await expect(july1stCell).toHaveClass(/has-pto/);

  // Click the cell to enter editing mode
  await july1stCell.click();

  // Wait for the render to complete
  await page.waitForTimeout(500);

  // Now the hours input should be visible
  const hoursInput = july1stCell.locator(".hours-input");
  await expect(hoursInput).toBeVisible();
  await expect(hoursInput).toHaveValue("80");

  // Change the hours from 80 to 8
  await hoursInput.fill("8");
  await hoursInput.blur();

  // Click the submit button
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
  await expect(page.locator(".notification-toast.success")).toBeVisible();
});
