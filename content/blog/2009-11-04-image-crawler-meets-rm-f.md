---
date: 2009-11-04 21:36:45+00:00
slug: image-crawler-meets-rm-f
tags:
- linux
- tips
title: Image Crawler Meets rm -f *
---

I wrote a simple web crawler that archived any images it found from a site with
a large number of backgrounds. I wanted to have rolling backgrounds that almost
never repeated.

I let my crawler go and stopped it after a 24 hour period. I ran `ls` on  the
directory the images were being saved in to see the results and my ssh session
locked up... Or so I thought. I hit Ctrl-C and nothing happened... So I closed
my window and opened a new one.

Maybe there was a file name that hit some weird glitch in `ls` causing it too
lock up. Not a big deal I can start from scratch. I switched to the directory
and ran an `rm -f *` and was greeted with this:

```
/bin/rm: Argument list too long.
```

Wait what? All I get was this irritating and slightly elusive error message. So
the * was being expanded, and making the list too long? To be sure I started
hunting in the man pages. `man rm` recommended me to `info coreutils 'rm
invocation'`. I read through and couldn't find any limitations or warnings that
might relate to the problem. The only thing I could find in there was a line
that said:

> GNU 'rm', like every program that uses the 'getopt' function to parse its
> arguments...

Moving on... getopt is parsing it's options... man and info pages on getopt
don't really reveal anything...

After some creative Googling I found the answer: getopt's argument limit is
1024. How many files did I have? I wanted to give ls one more try... I
typed it in and sure enough console froze... Or did it? I walked away and
did other things. When I came back I had a list of files longer than my
console buffer. I was smarter the second time around: `ls | wc -l`. After
about five minutes it came back again with just the number.

> 177654

I needed to clean up that directory and rm wasn't going to help me. `find . |
xargs rm -f1 and.... Victory! The directory is clean and happy again. Now I'll
just have to figure out how to cut down the number of files, or at the very
least organize them into more managable chunks...
