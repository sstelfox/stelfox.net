---
created_at: 2019-11-27T16:42:02-0500
evergreen: false
public: true
tags:
  - blender
  - cinnamon
  - linux
  - tips
slug: blender-loop-select-in-cinnamon
title: Blender Loop Select in Cinnamon
---

# Blender Loop Select in Cinnamon

I've recently been playing around with Blender (following [this tutorial series](https://www.youtube.com/playlist?list=PLjEaoINr3zgEq0u2MzVgAaHEBt--xLB6U)). In Part 4 of the Level 1 series, the host Andrew Price is teaching about loop selects which very simply is holding down Alt while clicking on a vertex. The issue wasn't working for me though I found quite a few other users experiencing the issue.

The most common fix was when people had three button mouse emulation enabled (a common setting people turn on when using laptops or Macs). I checked this and it wasn't my issue.

I'm running the Cinnamon desktop environment on Fedora (though I'm sure this would universally apply to all Cinnamon instances), which has a "convenience" feature that allows you to hold down a modifier key inside a window to move or resize it. By default this is Alt.

To change this open up the System Settings app, navigate to the Windows section, choose the Behavior tab and change the setting of "Special key to move and resize windows" to Disabled`. Problem solved loop select is working like a charm.
