import { test, expect } from "@playwright/test";

/**
 * Test to diagnose the scroll behavior when clicking "Edit" on employee cards.
 * When editing the last card, the editor should appear at the same screen
 * position the card occupied — no visible scrolling.
 */
test.describe("Employee Edit Scroll Behavior", () => {
  /**
   * Shared test logic for both desktop and mobile viewports.
   * Logs in, navigates to /admin/employees, scrolls to the last card,
   * clicks Edit, and asserts the editor appears near the card's position.
   */
  async function testEditScrollBehavior(
    page: import("@playwright/test").Page,
    request: import("@playwright/test").APIRequestContext,
  ) {
    // Step 1: Login as admin via magic link
    const linkResponse = await request.post("/api/auth/request-link", {
      data: { identifier: "admin@example.com" },
      headers: { "x-test-mode": "true" },
    });
    expect(linkResponse.ok()).toBe(true);
    const linkBody = await linkResponse.json();
    expect(linkBody.magicLink).toBeTruthy();

    // Follow magic link to set auth cookie
    await page.goto(linkBody.magicLink);
    await page.waitForURL(/\/(submit-time-off|admin)/);

    // Step 2: Navigate to admin employees page
    await page.goto("/admin/employees");
    await page.waitForSelector("admin-employees-page", { timeout: 10000 });

    // Wait for employee cards to render inside shadow DOM
    const adminPage = page.locator("admin-employees-page");
    const employeeList = adminPage.locator("employee-list");

    // Wait for employee cards
    await expect(employeeList.locator(".employee-card").first()).toBeVisible({
      timeout: 5000,
    });

    // Step 3: Count cards and find the last one
    const cardCount = await employeeList.locator(".employee-card").count();
    console.log(`Found ${cardCount} employee cards`);

    // Step 4: Scroll to make the last card visible.
    // The .employee-grid is NOT a scroll container (it grows freely with
    // content). The actual scroll container is the window/document.
    const lastCard = employeeList.locator(".employee-card").last();
    await lastCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);

    // Step 5: Capture pre-click state
    await expect(lastCard).toBeVisible();

    const preClickState = await page.evaluate(() => ({
      scrollY: window.scrollY,
      innerHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
    }));
    console.log("Pre-click window state:", JSON.stringify(preClickState));

    const lastCardBCR = await lastCard.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height };
    });
    console.log("Last card BCR:", JSON.stringify(lastCardBCR));

    // Step 6: Click the Edit button on the last card
    const editBtn = lastCard.locator('button[data-action="edit"]');
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Wait for the transition (fade-out + re-render)
    await page.waitForTimeout(500);

    // Step 7: Capture post-click state
    const editor = employeeList.locator(".inline-editor");
    const editorVisible = await editor.isVisible().catch(() => false);
    console.log("Editor visible:", editorVisible);

    if (editorVisible) {
      const editorBCR = await editor.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, height: r.height };
      });
      console.log("Editor BCR:", JSON.stringify(editorBCR));

      const postClickState = await page.evaluate(() => ({
        scrollY: window.scrollY,
        innerHeight: window.innerHeight,
      }));
      console.log("Post-click window state:", JSON.stringify(postClickState));

      // The editor should be visible within the viewport
      const viewportHeight = postClickState.innerHeight;

      // Editor should be at least partially within viewport
      expect(
        editorBCR.top < viewportHeight && editorBCR.bottom > 0,
        `Editor should be visible in viewport. Editor top=${editorBCR.top}, bottom=${editorBCR.bottom}, viewport=${viewportHeight}`,
      ).toBe(true);

      // Editor top should be near where the card was (within ~200px tolerance)
      const drift = Math.abs(editorBCR.top - lastCardBCR.top);
      console.log(
        `Position drift: ${drift}px (card was at ${lastCardBCR.top}, editor at ${editorBCR.top})`,
      );
      expect(
        drift,
        `Editor should appear near where card was. Card top=${lastCardBCR.top}, editor top=${editorBCR.top}, drift=${drift}px`,
      ).toBeLessThan(200);
    } else {
      // Take screenshot for debugging
      await page.screenshot({
        path: "/tmp/employee-edit-scroll-debug.png",
        fullPage: true,
      });
      console.log(
        "Editor not visible! Screenshot saved to /tmp/employee-edit-scroll-debug.png",
      );

      // Dump the full state
      const fullState = await employeeList.evaluate((el) => {
        const sr = el.shadowRoot;
        if (!sr) return "no shadow root";
        const grid = sr.querySelector(".employee-grid");
        const editorEl = sr.querySelector(".inline-editor");
        return {
          gridHTML: grid?.innerHTML?.substring(0, 500) || "no grid",
          editorExists: !!editorEl,
          editorHTML: editorEl?.outerHTML?.substring(0, 300) || "no editor",
          gridScrollTop: (grid as HTMLElement)?.scrollTop,
          gridScrollHeight: (grid as HTMLElement)?.scrollHeight,
          gridClientHeight: (grid as HTMLElement)?.clientHeight,
        };
      });
      console.log("Full state:", JSON.stringify(fullState));
      test.fail(true, "Editor was not visible after clicking Edit");
    }
  }

  test("editing last card should not cause scroll jump", async ({
    page,
    request,
  }) => {
    test.setTimeout(15000);
    await testEditScrollBehavior(page, request);
  });

  test("mobile: editing last card should not cause scroll jump", async ({
    page,
    request,
  }) => {
    test.setTimeout(15000);
    // Emulate Pixel 7 mobile viewport
    await page.setViewportSize({ width: 412, height: 915 });
    await testEditScrollBehavior(page, request);
  });
});
