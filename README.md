# Personal Website Source

This repository contains the source code for <https://stelfox.net>.

All raw content can be found in the "content/". This is designed to be compiled using [hugo](https://gohugo.io/).

Please refer to [LICENSE.md](./LICENSE.md) for official information related to licenses related to my content and code. Unofficially, the content is basically "Give me attribution for my work and you're free to use it as you will".

## Build Instructions

I'm currently using the hugo packaged and available in Arch Linux along with npm to build the site.

```console
$ sudo pacman -Sy hugo
$ npm install
```

Build a fresh version (into "public/") with either of the two following commands (they're equivalent):

```console
$ make
$ make build
```

Or to run a live server with the content:

```console
$ make server
```
