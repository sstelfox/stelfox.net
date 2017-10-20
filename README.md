# Source of Sam Stelfox's Thoughts & Notes

This repository contains the source code for https://stelfox.net

All raw content can be found in the `content/` directory, it is all markdown
with yaml headers. This is compiled using [hugo][1] and is using the
[minimo][2] theme by [MunifTanjim][3] slightly modified by myself.

Please refer to [LICENSE.md][4] for official information related to licenses
related to my content and code. Unofficially, the content is basically "Give me
attribution for my work and you're free to use it as you will".

I generally publish drafts of posts and notes before publishing them on my
site, so if you dig around you can probably get an idea of what I'm currently
working on.

If you would like to build my website yourself for some reason you can perform
the following commands on a system that has go already installed:

```
make depends
make
```

Or to run a live server with the content:

```
make depends
make server
```

[1]: https://gohugo.io/
[2]: https://themes.gohugo.io/theme/minimo/
[3]: https://github.com/MunifTanjim
