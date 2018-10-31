---
date: 2013-12-08 09:32:05 -0500
slug: running-emails-through-ruby
tags:
- linux
- ruby
- tips
title: Running Emails Through Ruby
---

Following up on my [earlier post][1] where I covered how to backup your Gmail
account using `fetchmail` and `procmail`; I wanted to cover how I was
additionally processing received mail through ruby.

This was part of a larger project where I was doing statistical analysis on my
email while evaluating various data stores. To get the emails into the various
data stores, I used the ruby script to parse, process and store the emails as
they came in.

If you're going to be doing any form of mail manipulation or statistics I
highly recommend the [mail][2] gem. It did almost everything I needed out of
the box, though it didn't correctly enumerate any of the additional headers.

Procmail is a highly flexible mail filtering and local delivery agent. Without
much effort you can pass the mail it is handling through a series of filters
which can manipulate and reject mail before eventually delivering it to your
inbox. In light of this, we're going to make a filter that simply counts the
total number of emails the script has processed, and add a header to the
message that indicates this count.

```ruby
#!/usr/bin/env ruby

require 'mail'

# Get the email message from STDIN or a passed filename
message = ""
while input = ARGF.gets
  message += input
end

# Parse the email into a ruby object
msg = Mail.new(message)

# Location of our count file
count_file = "#{ENV['HOME']}/.mail_counter.txt"

# Load or initialize our count value and increment it
count = File.exists?(count_file) ? File.read(count_file).to_i : 0
count += 1

# Update our count on disk
File.write(count_file, count.to_s)

# Add our header with the count
msg.header.fields << Mail::Field.new("X-Mail-Counter: #{count}")

# Output the now modified message back out to $stdout
begin
  $stdout.puts msg.to_s
rescue Errno::EPIPE
  exit(74)
end
```

Make sure you mark the script executable after saving it.

If you followed along with [my earlier post][1] the only change we need to make
is to add our ruby mail processor as a procmail filter. I've stored the script
in `~/.bin/mail-counter.rb`, if you've stored it in a different location you'll
want to update your path to reflect that.

Filters in procmail are handled by using the pipe helper. The following is a
minimum working example of a `procmailrc` file to make use of our filter:

```bash
MAILDIR=$HOME
VERBOSE=on

:0fw
| /home/sstelfox/Documents/ruby/riak-mail-indexer/counter.rb

:0
Maildir/
```

Store the above file in `~/.procmailrc`. The next time you run `fetchmail`
those headers will be added to the messages before being delivered and you can
watch the count increment by looking at the contents of `~/.mail_counter.txt`.

The following are a few additional sources I made use of while writing this
article:

* http://stackoverflow.com/questions/273262/best-practices-with-stdin-in-ruby
* http://www.jstorimer.com/blogs/workingwithcode/7766125-writing-ruby-scripts-that-respect-pipelines

[1]: {{< ref "./2013-11-19-backing-up-gmail-with-fetchmail.md" >}}
[2]: https://github.com/mikel/mail
