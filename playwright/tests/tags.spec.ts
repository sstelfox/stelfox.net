import { test, expect } from "@playwright/test";

test.describe("tags", () => {
  test("blog posts display tags as links", async ({ page }) => {
    await page.goto("/blog/");
    const firstTag = page.locator(".post-item .tag").first();
    await expect(firstTag).toBeVisible();

    const href = await firstTag.getAttribute("href");
    expect(href).toMatch(/^\/(tags|projects|notes)\//);
  });

  test("tag page lists posts as discover cards", async ({ page }) => {
    await page.goto("/tags/linux/");

    // The page should have a heading with the tag name
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // Should have discover cards listed
    const cards = page.locator(".discover-card");
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(9);
  });

  test("tag page discover cards have expected structure", async ({ page }) => {
    await page.goto("/tags/linux/");

    const card = page.locator(".discover-card").first();
    await expect(card.locator(".discover-card-title a")).toBeVisible();
    await expect(card.locator(".discover-card-date")).toBeVisible();
    await expect(card.locator(".reading-time")).toBeVisible();
    await expect(card.locator(".discover-card-excerpt")).toBeVisible();
  });

  test("tag page cards are in a grid layout", async ({ page }) => {
    await page.goto("/tags/linux/");

    const grid = page.locator(".blog-discover-grid");
    await expect(grid).toBeVisible();
  });

  test("tags overview shows tag cloud sorted by count", async ({ page }) => {
    await page.goto("/tags/");

    const cloud = page.locator(".tag-cloud");
    await expect(cloud).toBeVisible();

    const items = page.locator(".tag-cloud-item");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    // Each item should have a name and count
    const firstItem = items.first();
    await expect(firstItem.locator(".tag-cloud-name")).toBeVisible();
    await expect(firstItem.locator(".tag-cloud-count")).toBeVisible();

    // First tag should have the highest count (sorted descending)
    const firstCount = Number(await items.first().locator(".tag-cloud-count").textContent());
    const secondCount = Number(await items.nth(1).locator(".tag-cloud-count").textContent());
    expect(firstCount).toBeGreaterThanOrEqual(secondCount);
  });

  test("tags overview items are lowercase", async ({ page }) => {
    await page.goto("/tags/");

    const name = await page.locator(".tag-cloud-name").first().textContent();
    expect(name).toBe(name!.toLowerCase());
  });

  test("tags overview links to individual tag pages", async ({ page }) => {
    await page.goto("/tags/");

    const firstItem = page.locator(".tag-cloud-item").first();
    const href = await firstItem.getAttribute("href");
    expect(href).toMatch(/^\/tags\/.+\//);

    await firstItem.click();
    await expect(page).toHaveURL(/\/tags\/.+\//);
    await expect(page.locator(".discover-card").first()).toBeVisible();
  });

  test("project log entries show project label and section tag", async ({ page }) => {
    await page.goto("/projects/hive/logs/");
    const projectTags = page.locator(".tag-project");
    const sectionTags = page.locator(".tag-section");

    await expect(projectTags.first()).toBeVisible();
    await expect(sectionTags.first()).toBeVisible();

    // Project tag should link to the project page
    expect(await projectTags.first().getAttribute("href")).toBe("/projects/hive/");
    await expect(projectTags.first()).toHaveText("hive");
  });

  test("note entries show 'note' section tag", async ({ page }) => {
    await page.goto("/notes/");
    const sectionTag = page.locator(".tag-section").first();
    await expect(sectionTag).toBeVisible();
    await expect(sectionTag).toHaveText("note");
    expect(await sectionTag.getAttribute("href")).toBe("/notes/");
  });

  test("clicking a tag navigates to the tag page with cards", async ({ page }) => {
    await page.goto("/blog/");
    const tag = page.locator('.post-item .tag[href^="/tags/"]').first();
    await expect(tag).toBeVisible();

    await tag.click();
    await expect(page).toHaveURL(/\/tags\//);

    // Tag page should have discover cards
    await expect(page.locator(".discover-card").first()).toBeVisible();
  });
});
