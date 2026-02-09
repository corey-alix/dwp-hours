import { test, expect } from "@playwright/test";

test("pto-dashboard component test", async ({ page }) => {
  const consoleMessages: { type: string; text: string }[] = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    console.log("PAGE CONSOLE:", msg.type(), msg.text()); // Add this to see logs
  });

  await page.goto("/components/pto-dashboard/test.html");
  await page.waitForSelector("#test-output");

  // Allow for non-critical errors (like missing favicon)
  const criticalErrors = consoleMessages.filter(
    (msg) =>
      msg.type === "error" &&
      !msg.text.includes("favicon") &&
      !msg.text.includes("manifest"),
  );
  expect(criticalErrors).toHaveLength(0);

  await expect(page.locator("pto-summary-card")).toBeVisible();
  await expect(page.locator("pto-accrual-card")).toBeVisible();
  await expect(page.locator("pto-sick-card")).toBeVisible();
  await expect(page.locator("pto-bereavement-card")).toBeVisible();
  await expect(page.locator("pto-jury-duty-card")).toBeVisible();
  await expect(page.locator("pto-employee-info-card")).toBeVisible();

  // Assert pto-summary-card values
  await test.step("Assert pto-summary-card values", async () => {
    const summaryRows = await page.evaluate(() => {
      const card = document.querySelector("pto-summary-card");
      if (!card) return [];
      const shadow = card.shadowRoot;
      if (!shadow) return [];
      const rows = shadow.querySelectorAll(".row");
      return Array.from(rows).map((row) => row.textContent.trim());
    });
    expect(summaryRows[0]).toBe("Carryover40.00 hours");
    expect(summaryRows[1]).toBe("Annual Allocated96.00 hours");
    expect(summaryRows[2]).toBe("Used40.00 hours");
    expect(summaryRows[3]).toBe("Available96.00 hours");
  });

  // Assert pto-accrual-card values
  await test.step("Assert pto-accrual-card values", async () => {
    const accrualData = await page.evaluate(() => {
      const card = document.querySelector("pto-accrual-card");
      if (!card) return [];
      const shadow = card.shadowRoot;
      if (!shadow) return [];
      const rows = shadow.querySelectorAll(".accrual-row:not(.header)");
      return Array.from(rows).map((row) => {
        const month = row.querySelector(".month")?.textContent.trim();
        const hours = row.querySelector(".hours")?.textContent.trim();
        const used = row.querySelector(".used")?.textContent.trim();
        return { month, hours, used };
      });
    });
    expect(accrualData[0]).toEqual({
      month: "January",
      hours: "8.1",
      used: "24.0",
    });
    expect(accrualData[1]).toEqual({
      month: "February",
      hours: "7.4",
      used: "48.0",
    });
    expect(accrualData[2]).toEqual({
      month: "March",
      hours: "8.1",
      used: "16.0",
    });
    // Check July jury duty usage
    expect(accrualData[6]).toEqual({
      month: "July",
      hours: "8.5",
      used: "80.0",
    });
  });

  // Assert pto-sick-card values
  await test.step("Assert pto-sick-card values", async () => {
    // Wait for the playground function to set data
    await page.waitForTimeout(500);

    // Set test data for the sick card
    await page.locator("pto-sick-card").evaluate((card: any) => {
      card.bucket = { allowed: 24, used: 24, remaining: 0 };
      card.usageEntries = [
        { date: "2026-02-16", hours: 8 },
        { date: "2026-02-14", hours: 8 },
        { date: "2026-02-12", hours: 8 },
      ];
    });
    await page.waitForTimeout(100); // Wait for render

    // Check if toggle button exists
    const toggleButton = page
      .locator("pto-sick-card")
      .locator(".toggle-button");
    await expect(toggleButton).toBeVisible();
    await expect(toggleButton).toContainText("Show Details");

    // First expand the sick card details by clicking the toggle button
    await page.evaluate(() => {
      const card = document.querySelector("pto-sick-card");
      const button = card?.shadowRoot?.querySelector(
        ".toggle-button",
      ) as HTMLButtonElement;
      button?.dispatchEvent(new Event("click", { bubbles: true }));
    });
    await page.waitForTimeout(100); // Wait for render

    // Check button text changed
    await expect(toggleButton).toContainText("Hide Details");

    const sickData = await page.evaluate(() => {
      const card = document.querySelector("pto-sick-card");
      if (!card) return { rows: [], entries: [] };
      const shadow = card.shadowRoot;
      if (!shadow) return { rows: [], entries: [] };
      const rows = shadow.querySelectorAll(".row");
      const rowTexts = Array.from(rows).map((row) => row.textContent.trim());
      const entries = shadow.querySelectorAll(".usage-list li");
      const entryTexts = Array.from(entries).map((li) => li.textContent.trim());
      return { rows: rowTexts, entries: entryTexts };
    });
    expect(sickData.rows[0]).toBe("Allowed24 hours");
    expect(sickData.rows[1]).toBe("Used24.00 hours");
    expect(sickData.rows[2]).toBe("Remaining0.00 hours");
    expect(sickData.entries[0]).toBe("2/16/2026 8.0 hours");
    expect(sickData.entries[1]).toBe("2/14/2026 8.0 hours");
    expect(sickData.entries[2]).toBe("2/12/2026 8.0 hours");
  });

  // Assert pto-bereavement-card values
  await test.step("Assert pto-bereavement-card values", async () => {
    // First expand the bereavement card details
    await page
      .locator("pto-bereavement-card")
      .locator(".toggle-button")
      .click();

    const bereavementData = await page.evaluate(() => {
      const card = document.querySelector("pto-bereavement-card");
      if (!card) return { rows: [], entries: [] };
      const shadow = card.shadowRoot;
      if (!shadow) return { rows: [], entries: [] };
      const rows = shadow.querySelectorAll(".row");
      const rowTexts = Array.from(rows).map((row) => row.textContent.trim());
      const entries = shadow.querySelectorAll(".usage-list li");
      const entryTexts = Array.from(entries).map((li) => li.textContent.trim());
      return { rows: rowTexts, entries: entryTexts };
    });
    expect(bereavementData.rows[0]).toBe("Allowed40 hours");
    expect(bereavementData.rows[1]).toBe("Used24.00 hours");
    expect(bereavementData.rows[2]).toBe("Remaining16.00 hours");
    // Check usage entries
    expect(bereavementData.entries[0]).toBe("1/21/2026 8.0 hours");
    expect(bereavementData.entries[1]).toBe("1/22/2026 8.0 hours");
    expect(bereavementData.entries[2]).toBe("1/23/2026 8.0 hours");
  });

  // Assert pto-jury-duty-card values
  await test.step("Assert pto-jury-duty-card values", async () => {
    // First expand the jury duty card details
    await page.locator("pto-jury-duty-card").locator(".toggle-button").click();

    const juryData = await page.evaluate(() => {
      const card = document.querySelector("pto-jury-duty-card");
      if (!card) return { rows: [], entries: [] };
      const shadow = card.shadowRoot;
      if (!shadow) return { rows: [], entries: [] };
      const rows = shadow.querySelectorAll(".row");
      const rowTexts = Array.from(rows).map((row) => row.textContent.trim());
      const entries = shadow.querySelectorAll(".usage-list li");
      const entryTexts = Array.from(entries).map((li) => li.textContent.trim());
      return { rows: rowTexts, entries: entryTexts };
    });
    expect(juryData.rows[0]).toBe("Allowed40 hours");
    expect(juryData.rows[1]).toBe("Used80.00 hours");
    expect(juryData.rows[2]).toBe("Remaining-40.00 hours");
    // Check that there are 10 jury duty entries
    expect(juryData.entries.length).toBe(10);
    expect(juryData.entries[0]).toBe("7/20/2026 8.0 hours");
    expect(juryData.entries[9]).toBe("7/31/2026 8.0 hours");
  });

  // Assert pto-employee-info-card values
  await test.step("Assert pto-employee-info-card values", async () => {
    const infoRows = await page.evaluate(() => {
      const card = document.querySelector("pto-employee-info-card");
      if (!card) return [];
      const shadow = card.shadowRoot;
      if (!shadow) return [];
      const rows = shadow.querySelectorAll(".row");
      return Array.from(rows).map((row) => row.textContent.trim());
    });
    expect(infoRows[0]).toBe("Hire Date1/14/2020");
    expect(infoRows[1]).toBe("Next Rollover1/1/2027");
  });

  // Test calendar colorings for February (month 2)
  await test.step("Verify February calendar displays correct PTO and sick time entries", async () => {
    const februaryButton = page.locator("button.calendar-button").nth(1); // Second button is February
    await februaryButton.click();

    const calendar = page.locator("pto-calendar");
    await expect(calendar).toBeVisible();

    // Check that February sick days are correctly colored (based on actual rendering)
    const day12 = calendar.locator('.day[data-date="2026-02-12"]');
    await expect(day12).toHaveClass(/type-Sick/);
    await expect(day12).toContainText("8");

    const day14 = calendar.locator('.day[data-date="2026-02-14"]');
    await expect(day14).toHaveClass(/type-Sick/);
    await expect(day14).toContainText("8");

    const day16 = calendar.locator('.day[data-date="2026-02-16"]');
    await expect(day16).toHaveClass(/type-Sick/);
    await expect(day16).toContainText("8");

    // Check that February PTO days are correctly colored
    const day20 = calendar.locator('.day[data-date="2026-02-20"]');
    await expect(day20).toHaveClass(/type-PTO/);
    await expect(day20).toContainText("8");

    const day22 = calendar.locator('.day[data-date="2026-02-22"]');
    await expect(day22).toHaveClass(/type-PTO/);
    await expect(day22).toContainText("8");

    const day24 = calendar.locator('.day[data-date="2026-02-24"]');
    await expect(day24).toHaveClass(/type-PTO/);
    await expect(day24).toContainText("8");

    // Check that other days in February are not colored
    const day1 = calendar.locator('.day[data-date="2026-02-01"]');
    await expect(day1).not.toHaveClass(/type-/);

    const day5 = calendar.locator('.day[data-date="2026-02-05"]');
    await expect(day5).not.toHaveClass(/type-/);

    const day10 = calendar.locator('.day[data-date="2026-02-10"]');
    await expect(day10).not.toHaveClass(/type-/);
  });

  // Verify January calendar displays correct bereavement entries
  await test.step("Verify January calendar displays correct bereavement entries", async () => {
    const januaryButton = page.locator("button.calendar-button").first();
    await januaryButton.click();

    const janCalendar = page
      .locator("pto-accrual-card[accruals]")
      .locator(".calendar");
    await expect(janCalendar).toBeVisible();

    // Check that January bereavement days are correctly colored
    const day21 = janCalendar.locator('.day[data-date="2026-01-21"]');
    await expect(day21).toHaveClass(/type-Bereavement/);
    await expect(day21).toContainText("8");

    const day22 = janCalendar.locator('.day[data-date="2026-01-22"]');
    await expect(day22).toHaveClass(/type-Bereavement/);
    await expect(day22).toContainText("8");

    const day23 = janCalendar.locator('.day[data-date="2026-01-23"]');
    await expect(day23).toHaveClass(/type-Bereavement/);
    await expect(day23).toContainText("8");

    // Check that other days in January are not colored
    const day1 = janCalendar.locator('.day[data-date="2026-01-01"]');
    await expect(day1).not.toHaveClass(/type-/);

    const day10 = janCalendar.locator('.day[data-date="2026-01-10"]');
    await expect(day10).not.toHaveClass(/type-/);

    const day31 = janCalendar.locator('.day[data-date="2026-01-31"]');
    await expect(day31).not.toHaveClass(/type-/);
  });

  // Test calendar colorings for March (month 3)
  await test.step("Verify March calendar displays correct PTO entries", async () => {
    const marchButton = page.locator("button.calendar-button").nth(2); // Third button is March
    await marchButton.click();

    const marchCalendar = page.locator("pto-calendar");
    await expect(marchCalendar).toBeVisible();

    // Debug: check the pto-entries attribute
    const ptoEntriesAttr = await marchCalendar.getAttribute("pto-entries");
    console.log(
      "DEBUG: pto-entries attribute on pto-calendar:",
      ptoEntriesAttr,
    );

    // Check that March days 2-5 are correctly colored with PTO
    const marchDay2 = marchCalendar.locator('.day[data-date="2026-03-02"]');
    await expect(marchDay2).toHaveClass(/type-PTO/);
    await expect(marchDay2).toContainText("4");

    const marchDay3 = marchCalendar.locator('.day[data-date="2026-03-03"]');
    await expect(marchDay3).toHaveClass(/type-PTO/);
    await expect(marchDay3).toContainText("4");

    const marchDay4 = marchCalendar.locator('.day[data-date="2026-03-04"]');
    await expect(marchDay4).toHaveClass(/type-PTO/);
    await expect(marchDay4).toContainText("4");

    const marchDay5 = marchCalendar.locator('.day[data-date="2026-03-05"]');
    await expect(marchDay5).toHaveClass(/type-PTO/);
    await expect(marchDay5).toContainText("4");

    // Check that March 1st and other days are not colored
    const marchDay1 = marchCalendar.locator('.day[data-date="2026-03-01"]');
    await expect(marchDay1).not.toHaveClass(/type-/);

    const marchDay10 = marchCalendar.locator('.day[data-date="2026-03-10"]');
    await expect(marchDay10).not.toHaveClass(/type-/);
  });
});
