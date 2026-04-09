import { test, expect } from "@playwright/test";

test.describe("sitemap", () => {
  test("sitemap.xml is valid and contains key pages", async ({ request }) => {
    const resp = await request.get("/sitemap.xml");
    expect(resp.ok()).toBe(true);

    const body = await resp.text();
    expect(body).toContain('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');

    // Should include main sections (using path matching since baseURL varies)
    expect(body).toContain("/blog/</loc>");
    expect(body).toContain("/notes/</loc>");
    expect(body).toContain("/projects/</loc>");
    expect(body).toContain("/search/</loc>");
    expect(body).toContain("/about/</loc>");

    // Should include blog posts
    expect(body).toContain("/blog/2024/07/secure-boot-on-older-and-unstable-motherboards/");

    // Should include tag pages
    expect(body).toContain("/tags/security/");

    // Should include project pages
    expect(body).toContain("/projects/hive/");

    // Should have many entries
    const locCount = (body.match(/<loc>/g) || []).length;
    expect(locCount).toBeGreaterThan(100);
  });

  test("sitemap entries all have lastmod dates", async ({ request }) => {
    const resp = await request.get("/sitemap.xml");
    const body = await resp.text();

    const locCount = (body.match(/<loc>/g) || []).length;
    const lastmodCount = (body.match(/<lastmod>/g) || []).length;

    // Allow a small number to be missing lastmod (e.g. taxonomy root)
    expect(lastmodCount).toBeGreaterThan(locCount - 5);
  });
});

test.describe("rss feeds", () => {
  test("blog atom feed is valid RSS", async ({ request }) => {
    const resp = await request.get("/blog/atom.xml");
    expect(resp.ok()).toBe(true);

    const body = await resp.text();
    expect(body).toContain('<rss version="2.0"');
    expect(body).toContain("<channel>");
    expect(body).toContain("<title>");
    expect(body).toContain("<item>");

    const itemCount = (body.match(/<item>/g) || []).length;
    expect(itemCount).toBeGreaterThan(5);
  });

  test("blog feed items have required elements", async ({ request }) => {
    const resp = await request.get("/blog/atom.xml");
    const body = await resp.text();

    expect(body).toContain("<title>");
    expect(body).toContain("<link>");
    expect(body).toContain("<pubDate>");
    expect(body).toContain("<guid>");
    expect(body).toContain("<description>");
  });

  test("blog feed links use consistent base URL", async ({ request }) => {
    const resp = await request.get("/blog/atom.xml");
    const body = await resp.text();

    // Channel link should point to the blog section
    expect(body).toMatch(/<link>[^<]*\/blog\/<\/link>/);

    // Item links should point to blog posts
    const itemLinks = body.match(/<link>[^<]*\/blog\/\d{4}\/[^<]+<\/link>/g) || [];
    expect(itemLinks.length).toBeGreaterThan(0);
  });
});
