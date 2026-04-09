import { test, expect } from "@playwright/test";

test.describe("pagination", () => {
  test("blog list page 1 shows 10 posts and pagination controls", async ({ page }) => {
    await page.goto("/blog/");
    const items = page.locator(".post-item");
    await expect(items).toHaveCount(10);

    const nav = page.locator("nav.pagination");
    await expect(nav).toBeVisible();
  });

  test("clicking next page navigates to page 2", async ({ page }) => {
    await page.goto("/blog/");
    const nextLink = page.locator("nav.pagination a.pagination-next");
    await expect(nextLink).toBeVisible();

    await nextLink.click();
    await expect(page).toHaveURL(/\/blog\/page\/2\/#posts/);
    await expect(page.locator(".post-item").first()).toBeVisible();
  });

  test("page 2 has previous link back to page 1", async ({ page }) => {
    await page.goto("/blog/page/2/");
    const prevLink = page.locator("nav.pagination a.pagination-prev");
    await expect(prevLink).toBeVisible();

    await prevLink.click();
    await expect(page).toHaveURL(/\/blog\/(#posts)?$/);
  });

  test("current page is marked with aria-current", async ({ page }) => {
    await page.goto("/blog/page/3/");
    const current = page.locator('nav.pagination [aria-current="page"]');
    await expect(current).toBeVisible();
    await expect(current).toHaveText("3");
  });

  test("last page next button is disabled", async ({ page }) => {
    await page.goto("/blog/page/9/");
    // Last page should have disabled next (span, not a link)
    const nextLink = page.locator("nav.pagination a.pagination-next");
    await expect(nextLink).toHaveCount(0);
    const nextDisabled = page.locator("nav.pagination .pagination-next.pagination-disabled");
    await expect(nextDisabled).toBeVisible();
  });

  test("notes section is paginated", async ({ page }) => {
    await page.goto("/notes/");
    const nav = page.locator("nav.pagination");
    await expect(nav).toBeVisible();

    const items = page.locator(".post-item");
    await expect(items).toHaveCount(10);
  });
});
