---
searchable: false
public: true
title: Research Archiver Bot
slug: research-archiver
---

If you've found this site, then you likely noticed the user agent of one of my software projects that I refer to as the Research Archiver. This bot is intended to take snapshots of page content similar to the Wayback Machine, but selectively crawls pages that I want to preserve for my own research purposes.

If you'd prefer this bot no longer crawl your site, it respects entries you place in your [robots.txt](https://www.robotstxt.org/robotstxt.html) file with the key ResearchArchiver. It also respects the newer "X-Robots-Tag" header directives (but not meta tag equivalents as I haven't build a full HTML parser into it yet).

I have tried to make the bot as polite as possible, with very modest crawl rates , recognition and use of various HTTP cache directives, the robot directives, and the link microformat directives to not index and not crawl. By default will only crawl one-off pages. If I've requested a variety of pages from your site, the bot may automatically attempt to find interesting related content through a sitemap or RSS feed if available.

This is a not-for-profit personal project.

If this is causing you any issues, please feel free to reach out to [me as described on my about page](about).
