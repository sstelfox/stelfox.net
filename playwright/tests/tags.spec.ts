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

  test("tags overview shows categorized directory", async ({ page }) => {
    await page.goto("/tags/");

    // Should have category sections
    const sections = page.locator(".tag-directory-section");
    const sectionCount = await sections.count();
    expect(sectionCount).toBeGreaterThan(0);

    // Each section should have a heading
    const firstHeading = sections.first().locator(".tag-directory-heading");
    await expect(firstHeading).toBeVisible();
  });

  test("tags directory entries have name, count, and description", async ({ page }) => {
    await page.goto("/tags/");

    const row = page.locator(".tag-directory-row").first();
    await expect(row.locator(".tag-directory-name")).toBeVisible();
    await expect(row.locator(".tag-directory-count")).toBeVisible();
    await expect(row.locator(".tag-directory-desc")).toBeVisible();
  });

  test("tags directory entries are sorted by count within categories", async ({ page }) => {
    await page.goto("/tags/");

    // Check the first section's entries are sorted descending by count
    const firstSection = page.locator(".tag-directory-section").first();
    const counts = firstSection.locator(".tag-directory-count");
    const countValues = await counts.allTextContents();

    const nums = countValues.map(Number);
    for (let i = 1; i < nums.length; i++) {
      expect(nums[i]).toBeLessThanOrEqual(nums[i - 1]);
    }
  });

  test("tags directory links to individual tag pages", async ({ page }) => {
    await page.goto("/tags/");

    const firstLink = page.locator(".tag-directory-name a").first();
    const href = await firstLink.getAttribute("href");
    expect(href).toMatch(/^\/tags\/.+\//);

    await firstLink.click();
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
