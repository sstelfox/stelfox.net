--- 
date: 2015-04-22 16:47:10 -0400
slug: "ruby-code-quality-metrics"
tags:
- quality
- ruby
title: "Ruby Code Quality Metrics"
---

I like getting unopionated feedback on the quality of the code I write.
Sometimes I can get this from other developers but they tend to get annoyed
being asked after every commit whether they consider it an approvement.

There are a few utilities for Ruby codebases such as [flay][1], [flog][2], and
[rubocop][3] as well as hosted services such as [Code Climate][4] that can help
you identify chunks of code that can use some work.

While not directly connected to the quality of the code, I also make use of
[yard][5] and [simplecov][6] to assess documentation and test coverage of the
codebases I work on.

Using the tools means very little without some reference or understanding
doesn't get you very far. For a while I've been using flog and only comparing
the numbers against other codebases I control. I finally googled around and
found a [blog post][8] by a developer named Jake Scruggs from a while ago
(2008).

The blog post includes a rough table for assessing scores on individual methods
reported from the flog utility. From what I can tell the ranges are still
pretty accurate. I've tweaked the descriptions a bit to fit my mental
understanding a bit but the table is here:

| Method Score |  Description |
| ------------ | ------------ |
| 0   - 10     | Awesome      |
| 10  - 20     | Decent       |
| 20  - 40     | Might need refactoring |
| 40  - 60     | Should probably review |
| 60  - 100    | Danger       |
| 100 - 200    | Raise the alarm |
| 200+         | Seriously what are you doing!? |

I wanted to extend this with a second table providing a scale for the overall
method average with a more aggressive scale (an individual couple of methods
can be justifiably complex but the overall code base shouldn't be riddled with
them) but had a hard time working it out.

I've seen some awesome code bases with a score of 6.4 on average, some bad
larger ones with 7.8. Even some mediocre ones around a score of 10.6.

I guess I'll have to think more on it...

[1]: https://github.com/seattlerb/flay
[2]: https://github.com/seattlerb/flog
[3]: https://github.com/bbatsov/rubocop
[4]: https://codeclimate.com/
[5]: http://yardoc.org/
[6]: https://github.com/colszowka/simplecov
[7]: http://blog.codeclimate.com/blog/2013/08/07/deciphering-ruby-code-metrics/
[8]: http://jakescruggs.blogspot.com/2008/08/whats-good-flog-score.html
