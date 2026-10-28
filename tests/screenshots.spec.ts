import { test, expect } from "@playwright/test";

test("capture reviewed desktop and phone layouts", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "chromium",
    "One export per layout is sufficient.",
  );
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "A better understanding. A better ride.",
      }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `docs/screenshots/assistant-${width}.png`,
      fullPage: true,
    });
    const nav = page.getByRole("navigation", {
      name: width < 600 ? "Mobile navigation" : "Main navigation",
      exact: true,
    });
    await nav.getByRole("button").nth(1).click();
    await page.screenshot({
      path: `docs/screenshots/garage-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.screenshot({
      path: `docs/screenshots/sign-in-${width}.png`,
      fullPage: true,
    });
    await page.keyboard.press("Escape");
  }
});
