import { test, expect } from "@playwright/test";

test.describe("search", () => {
  test("search index loads and input becomes enabled", async ({ page }) => {
    await page.goto("/search/");
    const input = page.locator("#search-input");
    await expect(input).not.toBeDisabled({ timeout: 10_000 });
  });

  test("typing a query shows results", async ({ page }) => {
    await page.goto("/search/");
    const input = page.locator("#search-input");
    await expect(input).not.toBeDisabled({ timeout: 10_000 });

    await input.fill("security");
    await expect(page.locator(".search-result").first()).toBeVisible({ timeout: 5_000 });

    const count = page.locator("#search-count");
    await expect(count).not.toBeEmpty();
  });

  test("results contain highlighted matches", async ({ page }) => {
    await page.goto("/search/?q=security");
    const input = page.locator("#search-input");
    await expect(input).not.toBeDisabled({ timeout: 10_000 });

    await expect(page.locator(".search-result").first()).toBeVisible({ timeout: 5_000 });
    await expect(page.locator(".search-result mark").first()).toBeVisible();
  });

  test("query parameter pre-fills input and triggers search", async ({ page }) => {
    await page.goto("/search/?q=linux");
    const input = page.locator("#search-input");
    await expect(input).not.toBeDisabled({ timeout: 10_000 });

    await expect(input).toHaveValue("linux");
    await expect(page.locator(".search-result").first()).toBeVisible({ timeout: 5_000 });
  });

  test("short queries do not trigger search", async ({ page }) => {
    await page.goto("/search/");
    const input = page.locator("#search-input");
    await expect(input).not.toBeDisabled({ timeout: 10_000 });

    await input.fill("a");
    // Brief pause to give JS time to (not) react
    await page.waitForTimeout(500);
    await expect(page.locator(".search-result")).toHaveCount(0);
    await expect(page.locator("#search-count")).toBeEmpty();
  });

  test("no results message appears for nonsense query", async ({ page }) => {
    await page.goto("/search/");
    const input = page.locator("#search-input");
    await expect(input).not.toBeDisabled({ timeout: 10_000 });

    await input.fill("zxqvbnm123gibberish");
    await expect(page.locator(".search-no-results")).toBeVisible({ timeout: 5_000 });
  });

  test("clear button resets search", async ({ page }) => {
    await page.goto("/search/?q=linux");
    const input = page.locator("#search-input");
    await expect(input).not.toBeDisabled({ timeout: 10_000 });
    await expect(page.locator(".search-result").first()).toBeVisible({ timeout: 5_000 });

    await page.locator("#search-clear").click();
    await expect(input).toHaveValue("");
    await expect(page.locator(".search-result")).toHaveCount(0);
    await expect(page.locator("#search-count")).toBeEmpty();
  });

  test("section filter narrows results", async ({ page }) => {
    await page.goto("/search/?q=linux");
    const input = page.locator("#search-input");
    await expect(input).not.toBeDisabled({ timeout: 10_000 });
    await expect(page.locator(".search-result").first()).toBeVisible({ timeout: 5_000 });

    const allCount = await page.locator(".search-result").count();

    // Click a section filter
    await page.locator('.section-filter[data-section="notes"]').click();
    await page.waitForTimeout(300);

    const filteredResults = page.locator(".search-result");
    const filteredCount = await filteredResults.count();

    // Filtered set should be smaller or equal
    expect(filteredCount).toBeLessThanOrEqual(allCount);

    // Every visible result badge should say "notes"
    if (filteredCount > 0) {
      const badges = await page.locator(".search-result-section").allTextContents();
      for (const badge of badges) {
        expect(badge).toBe("notes");
      }
    }
  });

  test("header search navigates to search page", async ({ page }) => {
    await page.goto("/");
    const headerInput = page.locator("#header-search-input");
    await headerInput.fill("rust");
    await headerInput.press("Enter");

    await expect(page).toHaveURL(/\/search\/\?q=rust/);
    const searchInput = page.locator("#search-input");
    await expect(searchInput).not.toBeDisabled({ timeout: 10_000 });
    await expect(page.locator(".search-result").first()).toBeVisible({ timeout: 5_000 });
  });

  test("results link to actual pages", async ({ page }) => {
    await page.goto("/search/?q=linux");
    const input = page.locator("#search-input");
    await expect(input).not.toBeDisabled({ timeout: 10_000 });
    await expect(page.locator(".search-result").first()).toBeVisible({ timeout: 5_000 });

    const firstLink = page.locator(".search-result-title a").first();
    const href = await firstLink.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toMatch(/^\//);

    await firstLink.click();
    await expect(page).not.toHaveURL(/\/search\//);
  });
});
