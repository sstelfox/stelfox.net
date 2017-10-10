---
date: 2014-05-30 18:34:29 -0400
slug: extracting-content-from-markdown
tags:
- development
- tips
title: Extracting Content From Markdown
---

Recently I've been playing around with building a pure javascript full text
search engine for static content sites like this one. One of the challenges
with doing this has been working around the Markdown markup embedded in the
written content.

Most of the markdown syntax can be stripped out simply by removing all
non-alphanumeric characters from the document and move on. This doesn't solve
one of the bigger challenges I've experienced... code blocks. Code blocks have
plenty of regular english-ish words and can easily skew keyword detection
within it.

I didn't want to write my own Markdown parser, so I started with the one
already in use by this site's renderer ([redcarpet][1]). Another Github user,
[Markus Koller or toupeira on Github][2] provided [the basis][3] for the code
that became the redcarpet "StripDown" formatter, which was designed to
essentially render a Markdown document without the markup.

It does almost exactly what I want, except it still outputs raw code inside the
content. The following code sample includes a modified version that excludes
any code blocks. My content is also formatted inside the markdown documents to
never be longer than 80 lines, this also turns individual paragraphs and list
items into individual lines for paragraph detection.

```ruby
require 'redcarpet'
require 'redcarpet/render_strip'

class ContentRenderer < Redcarpet::Render::StripDown
  def block_code(*args)
    nil
  end

  def list_item(content, list_type)
    content.gsub("\n", " ") + "\n\n"
  end

  def paragraph(text)
    text.gsub("\n", " ") + "\n\n"
  end
end

markdown = Redcarpet::Markdown.new(ContentRenderer, fenced_code_blocks: true)
puts markdown.render(File.read('sample_markdown_article.md'))
```

The above code will print out just the content of the markdown formatted file
'sample_markdown_article.md'.

[1]: https://github.com/vmg/redcarpet
[2]: https://github.com/toupeira
[3]: https://github.com/vmg/redcarpet/issues/79
