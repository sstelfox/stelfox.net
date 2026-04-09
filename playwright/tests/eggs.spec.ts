import { test, expect } from "@playwright/test";

const CURSOR_HINTS: Record<string, string> = {
  Sam: "fox",
  Hannah: "sunflower",
  Zelda: "bee",
  Cookie: "cookie",
};

async function verifyCursorSpans(
  page: import("@playwright/test").Page,
  names: string[],
) {
  for (const name of names) {
    const spans = page.locator(`.content-body span, .home-intro span`).filter({
      hasText: new RegExp(`^${name}$`),
    });

    await expect(spans.first()).toBeVisible({ timeout: 5_000 });

    const cursor = await spans.first().evaluate((el) =>
      window.getComputedStyle(el).cursor
    );

    expect(
      cursor,
      `cursor for "${name}" should reference ${CURSOR_HINTS[name]}`
    ).toContain(CURSOR_HINTS[name]);
  }
}

test.describe("eggs", () => {
  test("home page has emoji cursors for family names", async ({ page }) => {
    await page.goto("/");
    await verifyCursorSpans(page, ["Sam", "Hannah", "Zelda", "Cookie"]);
  });

  test("about page has emoji cursors for family names", async ({ page }) => {
    await page.goto("/about");
    await verifyCursorSpans(page, ["Hannah", "Zelda", "Cookie"]);
  });
});
