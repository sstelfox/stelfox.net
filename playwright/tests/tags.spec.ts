import { test, expect } from "@playwright/test";

test.describe("tags", () => {
  test("blog posts display tags as links", async ({ page }) => {
    await page.goto("/blog/");
    const firstTag = page.locator(".post-item .tag").first();
    await expect(firstTag).toBeVisible();

    const href = await firstTag.getAttribute("href");
    expect(href).toMatch(/^\/(tags|projects|notes)\//);
  });

  test("tag page lists posts for that tag", async ({ page }) => {
    await page.goto("/tags/linux/");

    // The page should have a heading with the tag name
    const heading = page.locator("h1");
    await expect(heading).toBeVisible();

    // Should have post items listed
    const items = page.locator(".post-item");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
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

  test("clicking a tag navigates to the tag page", async ({ page }) => {
    await page.goto("/blog/");
    const tag = page.locator('.post-item .tag[href^="/tags/"]').first();
    await expect(tag).toBeVisible();

    await tag.click();
    await expect(page).toHaveURL(/\/tags\//);

    // Tag page should have posts
    await expect(page.locator(".post-item").first()).toBeVisible();
  });
});
