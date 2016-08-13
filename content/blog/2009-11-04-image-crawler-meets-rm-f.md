---
date: 2009-11-04 21:36:45+00:00
slug: "image-crawler-meets-rm-f"
tags:
- linux
- projects
title: "Image Crawler Meets rm -f *"
type: post
---

So for giggles I wrote a simple web crawler that archived any image it found on
a site that rapidly updated. My plan was to take all of the images resize them
to a fraction of what they were and make a collage progression of the images
posted over a 24 hours period. If that was successful I was going to try and
sort the image by the highest peak on a gray scale histogram of the image.

I let my crawler go and stopped it after a 24 hour period. I ls'd the directory
the images were being saved in to see how many I got and my ssh session locked
up... Or so I thought. I hit Ctrl - C and nothing happened... So I closed my
window and opened a new one. Did the same ls and the same thing happened. At
this point I was really confused, did my system get compromised?  Maybe a
trojan ls was put on my system that was broken somehow?

The last thought put me into a panic, I raced to a system that held incremental
backups of this entire system and ran an md5sum on /bin/ls on it and on every
ls that I could find in the backup. There hadn't been any change. At this point
I was fairly certain that wasn't the case so I moved on...

Maybe there was a filename that hit some weird glitch in ls's programming
causing it too lock up. If this was the case how should I go about fixing it? I
started thinking about how it would be a nice contribution to the community if
I could figure out the error and report it, but I decided to take the lazy way
out.

I cd'd to the directory and ran an rm -f * and was greeted with this:

> /bin/rm: Argument list too long.

Wait what? All I get was this irritating and slightly elusive error message. So
the * was being expanded, and making the list too long? To be sure I started
hunting in the man pages. `man rm` recommended me to `info coreutils 'rm
invocation'`. I read through and couldn't find any limitations or warnings that
might relate to the problem. The only thing I could find in there was a line
that said:

> GNU `rm', like every program that uses the `getopt' function to parse its
> arguments...

Alrighty moving on... so getopt is parsing it's options... man and info pages
on getopt don't really reveal anything... So to Google!

After a bit of googling I found the answer, getopt's argument limit is 1024.
So... how many files did I have? I wanted to give ls one more try... I typed it
in and sure enough console froze... or did it? I walked away and did other
things. When I came back I had a large list of files, longer than my console
buffer... Ok-day, lets try this again 'ls -l | wc -l'. After about five minutes
it came back again with just the number.

> 177654

Whoa... I wasn't expecting that... So how do I get around it... 'find . | xargs
rm -f' and.... WOO Victory! The directory is clean and happy again... Now i'll
just have to figure out how to cut down the number of files, or at the very
least organize them into more managable chunks...
