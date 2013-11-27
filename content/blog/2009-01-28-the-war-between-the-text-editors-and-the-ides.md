---
created_at: 2009-01-28 21:54:08+00:00
updated_at: 2009-01-28 21:54:08+00:00
type: post
kind: article
title: 'The War Between the Text Editors and the IDEs'
layout: blog_post
tags:
- development
- ides
---

Long has been the battle of programming in a text editor and IDEs. Both sides
have made good points and slung mud at the other. What all these zealots fail
to realize is that there are merits to both sides. This is true with almost
every war going on and while to each person the other side might seem
ridiculous that doesn't make the other side wrong. But I digress.

This topic recently surfaced on a private mailing list that me and about thirty
of my friends share. The topic didn't start as anything to do with development
at all but rather around the cheap netbooks and there effect on the economy,
moved into the time it takes to setup a computer after a full install. He
upgraded his OS because the software that he runs needed new libraries that
would break his old system. After upgrading he found weird compatibility issues
with the new libraries and his system.

All the time he spent setting up his computer was lost development time on his
various freelance projects. This is when it came around to development and
development environments.

> It is obvious to anyone who works with computers that a great deal of time
> can be spent on installing, configuring, and maintaining (upgrading)
> software. Since no real work is accomplished by this, such time can be
> thought of overhead time or as part of the "cost" of doing business in the
> computer field.

Back in the old days I programmed using a plain text editor and a command line
compiler, perhaps together with a make-like tool. There was no fancy IDE with
zillions of dependencies on complex graphical systems, no huge libraries, no
complex web browsers with multiple plug-ins, etc, etc. Most of my time was
spent actually writing programs. Huh.

I've used IDEs and I've used text editors. Personally I prefer text editors a
lot more, but I definitely see the merits. Since most of my development is
around PHP, a built in compiler doesn't do me much good. Subversion support
between IDEs vary and with every one you have to learn a different user
interface. On the other hand they allow you to quickly keep track of large
number of files. There are other features that IDEs have but this is the only
feature I can think of that is exclusive to IDEs that isn't in a plain text
editor.

Those familiar with vim or emacs (yes another war and for the record I'm on the
vim side), will be aware that they have syntax highlighting that would be the
other feature that the IDE side tends to argue is exclusive to them. Which is
sort of true since vim and emacs kind of blend both sides.

IDEs are bloated and complex with lots of features and buttons which takes a
lot of time to learn. Text editors are simple all they do is edit text. vim and
emacs both started out as simple text editors and they still behave exactly as
they did but they have a lot of features that are common in IDEs. You can even
compile from within them and at least in vim if the the compiler throws an
error vim can jump straight to the line the error is on.

I haven't even begun to cover this war but I'm fairly tired of typing. What my
verdict? Why not get the best of both worlds and just use vim or emacs?

