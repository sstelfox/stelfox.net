---
title: Blender Loop Select in Cinnamon
date: 2019-11-27T16:42:02-05:00

aliases:
  - /blog/2019/11/blender-loop-select-in-cinnamon/
slug: blender-loop-select-in-cinnamon

taxonomies:
  tags:
  - blender
  - cinnamon
  - linux
  - tips
---

I've recently been playing around with Blender (following [this tutorial
series][1]). In Part 4 of the Level 1 series, the host Andrew Price is teaching
about loop selects which very simply is holding down Alt while clicking on a
vertex. The issue wasn't working for me though I found quite a few other users
experiencing the issue.

<!-- more -->

The most common fix was when people had three button mouse emulation enabled (a
common setting people turn on when using laptops or Macs). I checked this and
it wasn't my issue.

I'm running the Cinnamon desktop environment on Fedora (though I'm sure this
would universally apply to all Cinnamon instances), which has a "convenience"
feature that allows you to hold down a modifier key inside a window to move or
resize it. By default this is Alt.

To change this open up the `System Settings` app, navigate to the `Windows`
section, choose the `Behavior` tab and change the setting of `Special key to
move and resize windows` to `Disabled`. Bam, problem solved loop select is
working like a charm.

[1]: https://www.youtube.com/playlist?list=PLjEaoINr3zgEq0u2MzVgAaHEBt--xLB6U
