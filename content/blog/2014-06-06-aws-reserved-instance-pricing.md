---
title: "AWS Reserved Instance Pricing"
date: 2014-06-06 13:28:11 -0400
slug: "aws-reserved-instance-pricing"
tags:
- aws
- pricing
type: post
---

The current large project I'm working on is going to be hosted on AWS and I was
requested to do a cost estimate. Looking into it, it quickly became clear that
reserved instances could potentially save quite a bit of cash but there was a
catch (isn't there alway).

There is an upfront cost for reserving the instance and in exchange you get a
reduced hourly rate. After running the numbers one thing wasn't clear too me,
is the upfront cost credit towards running machines or a fee you never see
again?

I immediately assumed the latter based on the numbers for one simple reason. If
you use the 'Light Reserved Instance' with a 1 year reservation, have your
machine running 24/7 the whole year it will cost your *more* than running the
same instance as 'on demand'. This was true for their m1.small, m3.medium, and
m3.large which was the only ones I ran the numbers for.

I searched the internet and wasn't able to find a solid answer to the question
until I asked Amazon's customer service directly.

Ultimately there probably is a price point where 1 year light reserved
instances make sense, and if you're looking too run 24/7 for the whole year
you'll want to do a heavy anyway for the most savings but it still surprised
me.

I'll probably do a project later using [d3.js][1] to get some direct hours run
vs total cost for various instances. It'll probably be a fun project.

[1]: http://d3js.org/
