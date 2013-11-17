---
title: Colophon
---

# Colophon

While I was building this site I had a few requirements:

* It needed to be fast and easy to host
* I needed to be able to update significant portions using only the command
  line
* I should learn something while creating it
* The style should be fairly simple
* I want to use Ruby to build it (my current programming language of choice)
* I want the content to be created using [GitHub style markdown][1]

There were many roads that I could down but ultimately decided that I’d follow
the growing trend of people that were building “flat-file” websites. This route
would make the site incredibly easy to host and as fast as you can get.

## The Engine

There are several solid flat-file site generators written in Ruby including
[Jekyll][2] and [Octopress][3] (Which is technically Jekyll behind the scenes
as well), however, those projects seem to have a few outstanding bugs, are
beginning to go stale, have some strange quirks and the maintainers of Jekyll
at least seem to be slow in accepting pull requests.

I took a stab at building my own, which was a never released bit of code I
named *StrangeCase*. It worked well and it generated my last site for over a
year. I moved away from it to [Nanoc][4] as it was more flexible than my
system, it just took me a while to get it customized to have feature parity
with mine and be able to handle all of my content.

[1]: https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet
[2]: https://github.com/mojombo/jekyll
[3]: http://octopress.org/
[4]: http://nanoc.ws/

