---
date: 2014-03-28 12:56:12 -0400
slug: preventing-tmux-lockups
tags:
- linux
title: Preventing Tmux Lockups
---

Anyone that has used SSH, Tmux or Screen for a while will have inevitably
dumped excessive output to their terminal. Depending on the size of the output
you may have experienced the dreaded lockup. That horrible realization seconds
after you hit the command where signals just stop working and you just have to
sit there and wait for your terminal to catch up.

There is a piece of remote connection software called Mosh that I've been told
handles this pretty well, but I don't yet trust its security model and it
doesn't prevent the same thing from happening locally.

This is especially bad if you're working in a multi-pane tmux window as it's
locks up all the terminals in the same window, and prevents you from changing
to the other windows.

I've had this issue happen to me one too many times but never thought of
looking for a solution until a friend of mine, [Gabe
Koss](http://gabekoss.com/), made a passing comment along the lines of "Too bad
tmux can't rate limit the output of a terminal".

A quick search through the doc and two relatively recent configuration options
popped out doing exactly what I was looking for (c0-change-internal, and
c0-change-trigger). Googling around for good values, left me wanting. A lot of
people were recommending setting the values to 100 and 250 respectively; These
are the defaults and since I still experience the issue are clearly not working
for me.

To set the variables to something more reasonable I had to understand what they
were doing. A 'C0' sequence is one that modifies the screen beyond a normal
character sequence, think newlines, carriage returns, backspaces. According to
the tmux man page, the trigger will catch if the number of c0 sequences per
**millisecond** exceeds the number in the configuration file, at which point it
will start displaying an update once every interval number of milliseconds.

I can't see faster than my eye's refresh rate so that seems like a decent
starting point. According to
[wikipedia](http://en.wikipedia.org/wiki/Frame_rate) the human eye/brain
interface can process 10-12 images per second but we can notice 'choppiness'
below 48 FPS.  Since I won't be reading anything flying by that fast I settled
on a maximum rate of 10 FPS updated in my shell, or an interval of '100ms'.

For the trigger I was signficantly less scientific, I dropped the trigger by
50, reloaded my tmux configuration, cat'd a large file and tested whether I
could immediately kill the process and move between panes. I finally settled on
a value of '75' for the trigger rate. It does make the output seem a little
choppy but it is signficantly nicer to not kill my terminal.

TL;DR Add the following lines to your ~/.tmux.conf file and you'll be in a much
better shape:

```
setw -g c0-change-interval 50
setw -g c0-change-trigger  75
```
