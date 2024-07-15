---
created_at: 2009-11-04T21:36:45+0000
evergreen: true
public: true
tags:
  - linux
  - tips
slug: image-crawler-meets-rm-f
title: Image Crawler Meets rm -f *
---

# Image Crawler Meets rm -f *

I wrote a simple web crawler that archived any images it found from a site with a large number of backgrounds. I wanted to have rolling backgrounds that almost never repeated.

I let my crawler go and stopped it after a 24 hour period. I listed the content of the directory the images were being saved in to see the results and my ssh session locked up... Or so I thought. I hit Ctrl-C and nothing happened... So I closed my window and opened a new one.

Maybe there was a file name that hit some weird glitch in ls causing it too lock up. Not a big deal I can start from scratch. I switched to the directory and tried to delete all the files inside the directory:

```console
$ rm -f *
/bin/rm: Argument list too long.
```

This elusive error message doesn't give you a whole lot to work with. The '*' was being expanded, and making the list too long? After hunting in the man pages, then the info pages before finding this sentence that may have been relevant:

> GNU 'rm', like every program that uses the 'getopt' function to parse its
> arguments...

After some creative Googling I found the answer: getopt's argument limit is 1024. How many files did I have? I wanted to give ls one more try... I typed it in and sure enough console froze... Or did it? I walked away and did other things. When I came back I had a list of files longer than my console buffer. I was smarter the second time which still took about five minutes:

```console
$ ls | wc -l
177654
```

That was it indeed, but I needed to come up with an alternate way to clean up this directory

```console
$ find . -exec rm -f {} \;
```

Victory! The directory is clean and happy again. Now I'll just have to organize those downloaded files into a directory hierarchy so the terminal is still useful to interact with them...
