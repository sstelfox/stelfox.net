---
created_at: 2023-04-21T20:30:22-0000
updated_at: 2024-07-14T17:05:37-0500
draft: true
menu: main
searchable: false
kind: page
title: Design Reference
---

# Design Reference

I use this page to test how [GitHub Flavored Markdown](https://github.github.com/gfm/)
gets rendered with my site's current design. This contains samples of all the
various features I use.

## H2

### H3

#### H4

##### H5

###### H6

## Base Styles

Lorem ipsum dolor sit amet, *consectetur adipiscing elit*. Sed interdum volutpat enim, vel dictum mi ultricies in. **Praesent et ante id diam** consequat vehicula. Donec ~~placerat magna tristique urna pretium~~ rutrum. Donec aliquet imperdiet ante id viverra. Vivamus ullamcorper, mi sed cursus tincidunt, urna nisl commodo neque, sit amet mollis sem massa at justo. Interdum et **malesuada fames ac _ante ipsum_** primis in faucibus. Sed iaculis est non laoreet venenatis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.

## Lists

1. First ordered list item
2. Another item
  * Unordered sub-list.
3. And another item.
  1. Ordered sub-list

   indented paragraphs within list items. Note the blank line above, and the leading spaces.

   line break in paragraph

- Unordered list
- with a couple elements

### Definition Lists

<dl>
  <dt>Term</dt>
  <dd>with a definition</dd>

  <dt>Markdown in HTML</dt>
  <dd>Does *not* work **very** well. Use HTML <em>tags</em>.</dd>
</dl>

## Links

[inline-style link](https://www.google.com)

[inline link with title](https://www.google.com "Google's Homepage")

[arbitrary link as reference text][Arbitrary case-insensitive reference text]

[relative reference to a repository file](../license)

[Numbers for reference-style link definitions][1]

use the [link text itself]

Intermediate text as placeholder after links before references.

[arbitrary case-insensitive reference text]: https://stelfox.net/
[1]: https://stelfox.net/about/
[link text itself]: https://stelfox.net/notes/

## Images

Inline-style:

![alt text](/logo.png "Logo Title Text 1")

Reference-style:

![alt text][logo]

[logo]: /logo.png "Logo Title Text 2"

## Code and Syntax Highlighting

Inline `code` with some extra text

```rust
fn main {
  println!("rust syntax highlighting");
}
```

```javascript
var s = "JavaScript syntax highlighting";
alert(s);
```

```python
s = "Python syntax highlighting"
print s
```

```
No language indicated, so no syntax highlighting in Markdown Here (varies on Github).
But let's throw in a <b>tag</b>.
```

## Tables

| Tables        | Are           | Cool   |
| ------------- |:-------------:| ------:|
| col 3 is      | right-aligned | $1600  |
| col 2 is      | centered      |   $12  |
| zebra stripes | are neat      |    $1  |
| *Still*         | `renders`       | **nicely** |
| 1             | 2             | 3      |

## Blockquotes

> Blockquotes are very handy in email to emulate reply text.
> This line is part of the same quote.

Quote break.

> This is a very long line that will still be quoted properly when it wraps. Oh boy let's keep writing to make sure this is long enough to actually wrap for everyone. Oh, you can *put* **Markdown** into a blockquote.

## Horizontal Rule

---

## Embedded YouTube Videos

They can't be added directly but you can add an image with a link to the video
like this:

```no-highlight
<a href="http://www.youtube.com/watch?feature=player_embedded&v=YOUTUBE_VIDEO_ID_HERE
" target="_blank"><img src="http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg"
alt="IMAGE ALT TEXT HERE" width="240" height="180" border="10" /></a>
```

Or, in pure Markdown, but losing the image sizing and border:

```no-highlight
[![IMAGE ALT TEXT HERE](http://img.youtube.com/vi/YOUTUBE_VIDEO_ID_HERE/0.jpg)](http://www.youtube.com/watch?v=YOUTUBE_VIDEO_ID_HERE)
```

## Mathjax

$$x = {-b \pm \sqrt{b^2-4ac} \over 2a}.$$
