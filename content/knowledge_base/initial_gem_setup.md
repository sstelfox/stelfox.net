---
title: Initial Gem Setup
tags:
- gem
- projects
- ruby
---

This is the process I go through when inititially setting up a gem. For this I
will be creating a gem named `super_g`.

```bash
# Create the initial super structure
bundle gem super_g -b -t rspec
cd super_g

# Remove the stock / sample tests
rm -f spec/super_g_spec.rb
```

* Remove the bin/ directory if you will not be using it.
* Clean the comment out of the Gemfile
* Add my name to the top of the LICENSE.txt file
* Clean-up anything in the Rakefile I dont want (usually just comments)
* Write the README
* Clean the comments out of lib/super_g.rb
* Fix up the gemspec file
* Configure rspec, travis-ci, coveralls, codeclimate, gemnasium, rubygems, and
  yard

Make the initial commit:

```bash
git add -A
git commit -m "Setup the support structure for the gem"
```

Create a new repo on github, add the remote locally, and push the code up:

```bash
git remote add origin git@github.com:sstelfox/super_g.git
git push origin master
```

## Fixup the Gemspec File

* Set an author
* Set an email
* Write a description
* Wire a summary
* Add a homepage
* Verify license
* Added the following development dependencies:
  * coveralls
  * simplecov
  * yard

Once complete run `bundle` to make sure all the dependencies are available.

## Configure RSpec

First off fix the RSpec settings file located at .rspec:

```txt
--format progress
--color
```

Next change spec/spec_helper.rb to support coveralls and be a tad bit nicer to
rapid testing.

```ruby
$LOAD_PATH.unshift(File.expand_path('../../lib', __FILE__))

require 'coveralls'
require 'simplecov'

SimpleCov.formatter = SimpleCov::Formatter::MultiFormatter[
  SimpleCov::Formatter::HTMLFormatter,
  Coveralls::SimpleCov::Formatter
]
SimpleCov.start

require 'super_g'

RSpec.configure do |config|
  config.treat_symbols_as_metadata_keys_with_true_values = true
  config.run_all_when_everything_filtered = true
  config.filter_run :focus
  config.order = 'random'
end
```

## Configure Travis-CI

The following is my standard Travis-CI config.

```yaml
language: ruby
rvm:
  - 1.9.3
  - 2.0.0
  - 2.1.0
```

## Configure YARD

Create a .yardopts file in the root of the projec with the following contents:

```txt
--private
--protected
lib/**/*.rb - README.md LICENSE.txt
```

You can test it out by running 'yard' and opening doc/index.html in your
browser.

## Configure Coveralls

Setting up the service is still a TODO but part of it was done in RSpec
already.

* https://coveralls.io/docs/ruby

## Configure CodeClimate

TODO, partially covered by badges in the README

## Write the README

TODO: see belfort project

### Badges

Available badges and tracking information:

* Gem version (https://rubygems.org/) (https://badge.fury.io/)
* Code Climate (https://codeclimate.com/)
* Travis-CI (https://travis-ci.org/)
* Dependency Status (https://gemnasium.com/)
* Coveralls (https://coveralls.io)
* Githalytics (http://githalytics.com/)
* Kiuwan (Code maintainability?) (https://kiuwan.com/)

Badges should be added for all the services in use by this project a sample of
this might look like:

```markdown
# TODO: Your gem name

[![Gem Version][GV img]][Gem Version]
[![Build Status][BS img]][Build Status]
[![Dependency Status][DS img]][Dependency Status]
[![Code Climate][CC img]][Code Climate]
[![Coverage Status][CS img]][Coverage Status]

## Description

TODO: Your gem description

[Gem Version]: https://rubygems.org/gems/<gem name>
[Build Status]: https://travis-ci.org/sstelfox/<gem name>
[travis pull requests]: https://travis-ci.org/sstelfox/<gem name>/pull_requests
[Dependency Status]: https://gemnasium.com/sstelfox/<gem name>
[Code Climate]: https://codeclimate.com/github/sstelfox/<gem name>
[Coverage Status]: https://coveralls.io/r/sstelfox/<gem name>

[GV img]: https://badge.fury.io/rb/<gem name>.png
[BS img]: https://travis-ci.org/sstelfox/<gem name>.png
[DS img]: https://gemnasium.com/sstelfox/<gem name>.png
[CC img]: https://codeclimate.com/github/sstelfox/<gem name>.png
[CS img]: https://coveralls.io/repos/sstelfox/<gem name>/badge.png?branch=master
```

More info: http://elgalu.github.io/2013/add-achievement-badges-to-your-gem-readme/
