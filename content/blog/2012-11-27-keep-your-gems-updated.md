---
date: 2012-11-27 14:17:00 -0500
slug: keep-your-gems-updated
tags:
- ruby
- security
title: Keep Your Gems Updated
---

I recently went back through my backups recently and found quite a few old
abandoned projects. Looking back on the code I see some things I'm impressed
with, but the majority of the code I wouldn't write today. That's not to say
the code is bad, or doesn't function. It did exactly what I wanted to
accomplish at the time, just not necessarily in the most efficient way.

This archive of old code made me start wondering how much old code I'm using in
the projects that I'm currently writing. Not code that I've written but code
that I'm depending on, specifically gems. As of this writing I have 26 active
ruby projects in various states of development all of which make use of RVM and
`bundler`.

Conveniently enough, `bundler` provides an easy way to update all the gems
installed in a project unless specific version information was provided in the
`Gemfile`. None of my projects have had a version directly specified in the
`Gemfile` with the exception of Rails. Each project also has solid test
coverage (though I must admit it's usually not complete).

For each project I went through and ran `bundle update` and kept track of the
results. I did not keep track of unique gems so the four Rails projects
probably had a lot of duplicate gems each one more or less likely to have
different versions of different gems installed depending on when I started the
project.

Across all of the different projects I had 2214 gems installed. Of those 813
had updates. My initial plan was to go through the updates and see how many of
those updates were security or bug fixes, how many were added features, or
performance improvements, but I wasn't counting on the shear number of gems
that my projects were depending on.

The big question for myself after I updated the Gems was how much will this be
now? Running through the thousands of tests in all of the projects I had
exactly 7 tests that were now failing and they were all due too projects that
removed or renamed a piece of functionality that I was making use of. In one
case I had to extend the core Hash method to replace the functionality. All in
all it took me about a quarter of an hour to fix all the tests after updating
my Gems.

Since I didn't actually go through all of the gems I don't know for sure that
my projects are in anyway more secure, faster, or more stable but I can't
imagine they're in a worse state. If you have test coverage on your projects
you should try and update the gems and see for yourself.
