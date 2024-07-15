---
created_at: 2016-02-18T15:46:12-0500
tags:
  - development
  - ruby
slug: sharing-context-between-dependent-rake-tasks
title: Sharing Context Between Dependent Rake Tasks
---

I use Rakefiles quite a bit like traditional Makefiles, in that I specify
immediate dependencies for an individual task and Rake will execute all of
them. If a file or directory is the dependency and it exists, the task that
creates it will be skipped. A contrived Rakefile example might look like:

```ruby
file 'sample' do |t|
  puts 'Creating sample directory'
  Dir.mkdir(t.name)
end

file 'sample/population.txt' => ['sample'] do |t|
  puts 'Creating sample population file...'
  # Perhaps download a dataset? Lets just create the file
  File.write(t.name, "---> Very important data <---\n")
end

task :process_population => ['sample/population.txt'] do
  puts 'Check out our data!'
  # Do some processing... whatever you need to...
  puts File.read('sample/population.txt')
end
```

The first time you run it you'll the following output:

```
$ rake process_population
Creating sample directory
Creating sample population file...
Check out our data!
---> Very important data <---
```

And subsequent runs will skip the creation since they're already present:

```
$ rake process_population
Check out our data!
---> Very important data <---
```

This is fine for statically implementing file contents, but what if you need
additional information to generate the file? With a normal rake task you can
provide bracketed arguments to access additional information like so:

```
task :args_example, :word do |t, args|
  puts "The word is: #{args.word}"
end
```

You'd use it like so:

```
$ rake args_example[data]
The word is: data
```

That information isn't made available to the dependent tasks though so we need
to broaden our scope a little bit. There is another way to provide arguments to
Rake using key value pairs. This has a bonus that was kind of an obvious
solution once I found it. Rake provides the values of key/value pairs to a task
via environment variables. Another contrived example of how to use this
(specifically with a file dependency example):

```ruby
file 'passed_state' do |t|
  puts 'Creating state file'
  File.write(t.name, ENV['state'])
end

task :read_state => ['passed_state'] do
  puts File.read('passed_state')
end
```

```sh
$ rake read_state state=something
Creating state file
something
```

State has been transferred! There is a gotcha, that is handling expiration of
data yourself. Passing in state again with a different value you'll see the
problem:

```sh
$ rake read_state state=notsomething
something
```

It won't recreate that file again until it's removed which you'll need to
handle on your own.
