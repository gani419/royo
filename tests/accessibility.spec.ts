import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [390, 768, 1440]) {
  test(`accessible workspace and dialogs at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    await page.goto("/");
    const scan = () =>
      new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
    expect((await scan()).violations).toEqual([]);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect((await scan()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Use dark theme" }).click();
    expect((await scan()).violations).toEqual([]);
  });
}
