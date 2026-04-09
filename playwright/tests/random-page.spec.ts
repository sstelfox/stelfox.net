import { test, expect } from "@playwright/test";

test.describe("random page dice link", () => {
  test("dice link is visible in the footer", async ({ page }) => {
    await page.goto("/");
    const diceLink = page.locator("#random-page-link");
    await expect(diceLink).toBeVisible();
    await expect(diceLink).toHaveAttribute("title", "Go to a random page");
  });

  test("dice link contains an SVG icon", async ({ page }) => {
    await page.goto("/");
    const svg = page.locator("#random-page-link svg.dice-icon");
    await expect(svg).toBeVisible();
  });

  test("clicking dice navigates to a page from the search index", async ({ page }) => {
    await page.goto("/");

    const indexResponse = await page.request.get("/search_index.json");
    const documents = await indexResponse.json();
    const validUrls = documents.map((doc: { url: string }) => doc.url);

    expect(validUrls.length).toBeGreaterThan(0);

    await page.locator("#random-page-link").click();
    await page.waitForURL((url) => url.pathname !== "/", { timeout: 10_000 });

    const landedPath = new URL(page.url()).pathname;
    expect(
      validUrls,
      `navigated to ${landedPath} which should be in the search index`,
    ).toContain(landedPath);
  });

  test("dice link appears on non-home pages too", async ({ page }) => {
    await page.goto("/about/");
    const diceLink = page.locator("#random-page-link");
    await expect(diceLink).toBeVisible();
  });
});
