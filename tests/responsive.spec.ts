import { test, expect } from "@playwright/test";

const sizes = [
  [320, 568],
  [360, 800],
  [390, 844],
  [599, 800],
  [600, 900],
  [768, 1024],
  [839, 900],
  [840, 900],
  [1024, 768],
  [1199, 900],
  [1200, 900],
  [1440, 960],
  [1920, 1080],
  [2560, 1440],
  [844, 390],
];
for (const [width, height] of sizes) {
  test(`responsive screens and dialogs at ${width}×${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: width!, height: height! });
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "A better understanding. A better ride.",
      }),
    ).toBeVisible();
    if (width! < 600)
      await expect(
        page.getByRole("button", { name: "Send message" }),
      ).toBeInViewport();
    const nav = page.getByRole("navigation", {
      name: width! < 600 ? "Mobile navigation" : "Main navigation",
      exact: true,
    });
    for (const [button, heading] of [
      ["Garage", "Your motorcycles. All in one place."],
      ["Logbook", "Keep your ride in good company."],
      ["History", "Pick up where you left off."],
      ["Assistant", "A better understanding. A better ride."],
    ]) {
      const index = ["Assistant", "Garage", "Logbook", "History"].indexOf(
        button!,
      );
      await nav.getByRole("button").nth(index).click();
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBeTruthy();
      const overlaps = await nav.getByRole("button").evaluateAll((nodes) =>
        nodes.some((a, i) =>
          nodes.slice(i + 1).some((b) => {
            const x = a.getBoundingClientRect(),
              y = b.getBoundingClientRect();
            return (
              x.left < y.right &&
              x.right > y.left &&
              x.top < y.bottom &&
              x.bottom > y.top
            );
          }),
        ),
      );
      expect(overlaps).toBeFalsy();
    }
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    expect(
      await dialog.evaluate((d) => {
        const r = d.getBoundingClientRect();
        return (
          r.left >= 0 &&
          r.right <= innerWidth &&
          r.top >= 0 &&
          r.bottom <= innerHeight
        );
      }),
    ).toBeTruthy();
    await expect(dialog.getByLabel("Email address")).toBeVisible();
    await dialog.getByRole("button", { name: "Create an account" }).click();
    await expect(dialog.getByLabel("Confirm password")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
    await page.getByRole("button", { name: "Use dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(errors).toEqual([]);
  });
}

test("draft survives navigation, resize, theme, and offline mode", async ({
  page,
  context,
}) => {
  await page.goto("/");
  const input = page.getByLabel("Describe your motorcycle issue");
  await input.fill("There is a rattle when accelerating.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .getByRole("button", { name: "Garage" })
    .click();
  await page
    .getByRole("navigation", { name: "Mobile navigation", exact: true })
    .getByRole("button", { name: "Assistant" })
    .click();
  await expect(input).toHaveValue("There is a rattle when accelerating.");
  await context.setOffline(true);
  await expect(
    page.getByText("You’re offline.", { exact: false }),
  ).toBeVisible();
  await expect(input).toHaveValue("There is a rattle when accelerating.");
  await context.setOffline(false);
});
