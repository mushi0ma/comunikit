import { test, expect, devices } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

// ─── AppLayout loads correctly ──────────────────────────────────────────────
test("AppLayout renders header and layout shell", async ({ page }) => {
  await page.goto(`${BASE_URL}/feed`);

  // Sticky header is present
  const header = page.locator("header");
  await expect(header).toBeVisible();

  // Brand name renders
  await expect(page.getByText("comunikit")).toBeVisible();
});

// ─── Mobile Bottom Navigation ────────────────────────────────────────────────
test("Mobile bottom navigation is visible on mobile viewport", async ({
  browser,
}) => {
  const ctx = await browser.newContext({
    ...devices["iPhone 14"],
  });
  const page = await ctx.newPage();

  await page.goto(`${BASE_URL}/feed`);

  // Bottom nav has class ck-bottom-nav and is rendered (not hidden via lg:hidden at 390px)
  const bottomNav = page.locator("nav.ck-bottom-nav");
  await expect(bottomNav).toBeVisible();

  // All 5 nav items present: Лента, Карта, Добавить, Форум, Профиль
  for (const label of ["Лента", "Карта", "Добавить", "Форум", "Профиль"]) {
    await expect(bottomNav.getByText(label)).toBeVisible();
  }

  await ctx.close();
});

// ─── HomeFeed Bento Grid ─────────────────────────────────────────────────────
test("HomeFeed renders 4-card Bento quick-categories grid", async ({ page }) => {
  await page.goto(`${BASE_URL}/feed`);

  // Default state: activeTab=all, no search — grid should be visible
  const bentoGrid = page.locator(".ck-animate-in").first();
  await expect(bentoGrid).toBeVisible();

  // Verify all 4 category buttons
  for (const label of ["Продажа", "Покупка", "Услуги", "Форум"]) {
    await expect(page.getByRole("button", { name: label })).toBeVisible();
  }

  // Clicking "Продажа" switches tab and hides the bento grid
  await page.getByRole("button", { name: "Продажа" }).click();
  await expect(bentoGrid).not.toBeVisible();
});
