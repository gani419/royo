import { test, expect, type Page } from "@playwright/test";

async function register(page: Page) {
  const email = `rider-${crypto.randomUUID()}@example.com`;
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Create an account" }).click();
  await dialog.getByLabel("Full name", { exact: true }).fill("Test Rider");
  await dialog.getByLabel("Email address", { exact: true }).fill(email);
  await dialog.getByLabel("Password", { exact: true }).fill("StrongPass123!");
  await dialog
    .getByLabel("Confirm password", { exact: true })
    .fill("StrongPass123!");
  await dialog
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  return email;
}

for (const width of [390, 768, 1440]) {
  test(`real backend product flow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 });
    const email = await register(page);
    await page
      .getByRole("button", { name: "Add your motorcycle", exact: true })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("combobox", { name: "Model", exact: true }),
    ).not.toHaveValue("");
    await dialog.getByLabel("Nickname", { exact: false }).fill("Sunday Ride");
    await dialog.getByLabel("Odometer (km)").fill("12500");
    await dialog
      .getByRole("button", { name: "Add motorcycle", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    await expect(
      width < 600
        ? page.getByRole("button", { name: /Sunday Ride/ })
        : page.getByRole("heading", { name: "Sunday Ride" }),
    ).toBeVisible();
    await page
      .getByRole("navigation", {
        name: width < 600 ? "Mobile navigation" : "Main navigation",
        exact: true,
      })
      .getByRole("button")
      .nth(2)
      .click();
    await page
      .getByRole("button", { name: "Log service", exact: true })
      .click();
    await page
      .getByLabel("Service title", { exact: true })
      .fill("Oil and filter change");
    await page.getByLabel("Odometer (km)").fill("12750");
    await page.getByLabel("Cost (INR)").fill("1450.50");
    await page.getByRole("button", { name: "Save service record" }).click();
    await expect(
      page.getByRole("heading", { name: "Oil and filter change" }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Oil and filter change" }),
    ).toBeVisible();
    await page
      .getByRole("navigation", {
        name: width < 600 ? "Mobile navigation" : "Main navigation",
        exact: true,
      })
      .getByRole("button")
      .nth(0)
      .click();
    await expect(
      (width < 600
        ? page.locator(".mobile-ride")
        : page.locator(".context-stats")
      ).getByText("12,750 km", { exact: true }),
    ).toBeVisible();
    await page
      .getByLabel("Describe your motorcycle issue")
      .fill("My engine rattles when accelerating.");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByRole("alert")).toContainText(
      "AI assistance is unavailable",
    );
    await expect(page.getByLabel("Describe your motorcycle issue")).toHaveValue(
      "My engine rattles when accelerating.",
    );
    await expect(page.locator(".quota")).toContainText("5");
    const navigation = page.getByRole("navigation", {
      name: width < 600 ? "Mobile navigation" : "Main navigation",
      exact: true,
    });
    await navigation.getByRole("button").nth(3).click();
    await expect(page.locator(".history-open")).toHaveCount(1);
    await page.locator(".history-open").click();
    await expect(page.getByRole("log")).toContainText(
      "My engine rattles when accelerating.",
    );
    await navigation.getByRole("button").nth(3).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: /^Delete .*Diagnostics/ }).click();
    await expect(
      page.getByRole("heading", { name: "Good questions belong here." }),
    ).toBeVisible();
    await navigation.getByRole("button").nth(0).click();
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => localStorage.getItem("royo_refresh_token")),
    ).toBeNull();
    expect(
      await page.evaluate(() => sessionStorage.getItem("royo_access_token")),
    ).toBeNull();
    await expect(
      page.getByText("Sunday Ride", { exact: true }),
    ).not.toBeVisible();
    await page.reload();
    await expect(
      page.getByRole("button", { name: "Sign in", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await dialog.getByLabel("Email address").fill(email);
    await dialog.getByLabel("Password", { exact: true }).fill("StrongPass123!");
    await dialog.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await expect(
      width < 600
        ? page.getByRole("button", { name: /Sunday Ride/ })
        : page.getByRole("heading", { name: "Sunday Ride" }),
    ).toBeVisible();
  });
}

test("API ownership and refresh token single-use under concurrency", async ({
  request,
}) => {
  const url = "http://127.0.0.1:18080/api/v1";
  const create = async () =>
    (
      await (
        await request.post(`${url}/auth/register`, {
          data: {
            email: `${crypto.randomUUID()}@example.com`,
            password: "StrongPass123!",
            fullName: "API Rider",
          },
        })
      ).json()
    ).data;
  const a = await create(),
    b = await create();
  const models = (await (await request.get(`${url}/vehicles/models`)).json())
    .data;
  const vehicle = (
    await (
      await request.post(`${url}/vehicles`, {
        headers: { Authorization: `Bearer ${a.tokens.accessToken}` },
        data: { modelId: models[0].id, modelYear: 2024, odometerKm: 0 },
      })
    ).json()
  ).data;
  const denied = await request.get(`${url}/vehicles/${vehicle.id}`, {
    headers: { Authorization: `Bearer ${b.tokens.accessToken}` },
  });
  expect(denied.status()).toBe(404);
  const attempts = await Promise.all(
    Array.from({ length: 8 }, () =>
      request.post(`${url}/auth/refresh`, {
        data: { refreshToken: a.tokens.refreshToken },
      }),
    ),
  );
  expect(attempts.filter((r) => r.ok())).toHaveLength(1);
});
