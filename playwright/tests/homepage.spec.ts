import { test, expect } from "@playwright/test";

test.describe("homepage", () => {
  test("latest highlight shows newest post with expected elements", async ({ page }) => {
    await page.goto("/");

    const highlight = page.locator(".latest-highlight");
    await expect(highlight).toBeVisible();

    // Title is a link
    const title = highlight.locator(".discover-card-title a");
    await expect(title).toBeVisible();
    const href = await title.getAttribute("href");
    expect(href).toBeTruthy();
    expect(href).toMatch(/^\//);

    // Date, author, and reading time are present
    await expect(highlight.locator(".discover-card-date")).toBeVisible();
    await expect(highlight.locator(".latest-author")).toHaveText("Sam Stelfox");
    await expect(highlight.locator(".reading-time")).toBeVisible();

    // Excerpt is present
    await expect(highlight.locator(".discover-card-excerpt")).not.toBeEmpty();

    // Tags are rendered in badge style
    await expect(highlight.locator(".discover-card-tags")).toBeVisible();
    await expect(highlight.locator(".discover-card-tags .tag").first()).toBeVisible();

    // Read more link points to same URL as title
    const readMore = highlight.locator(".latest-read-more");
    await expect(readMore).toBeVisible();
    expect(await readMore.getAttribute("href")).toBe(href);
  });

  test("recent posts list shows 10 items", async ({ page }) => {
    await page.goto("/");
    const items = page.locator(".recent-posts .post-item");
    await expect(items).toHaveCount(10);
  });

  test("recent post items have dates and titles", async ({ page }) => {
    await page.goto("/");
    const items = page.locator(".recent-posts .post-item");
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      await expect(item.locator(".post-date")).not.toBeEmpty();
      await expect(item.locator(".post-title")).not.toBeEmpty();
      const link = item.locator(".post-link");
      expect(await link.getAttribute("href")).toMatch(/^\//);
    }
  });

  test("recent posts include project log entries alongside blog posts", async ({ page }) => {
    await page.goto("/");
    const links = page.locator(".recent-posts .post-link");
    const hrefs: string[] = [];
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      hrefs.push(await links.nth(i).getAttribute("href") ?? "");
    }

    const hasBlog = hrefs.some((h) => h.startsWith("/blog/"));
    const hasProject = hrefs.some((h) => h.startsWith("/projects/"));
    expect(hasBlog).toBe(true);
    expect(hasProject).toBe(true);
  });
});
