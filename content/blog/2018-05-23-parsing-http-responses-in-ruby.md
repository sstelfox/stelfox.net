---
date: 2018-05-23T07:53:19-06:00
tags:
- ruby
- frustration
title: Parsing HTTP Responses in Ruby
---

Normally handling HTTP responses in Ruby is rather straight forward. There is a
native library in Ruby that handles HTTP requests which parses the responses
into a neat data structure that you can then operate on. What if you want to
work on stored HTTP responses outside of a connection though? This was the
situation I found myself in and thanks to a series of unusual decisions in the
Ruby core library I found myself left out in the cold.

For reference this is in the latest stable Ruby as of this writing (2.5.1).

Let's start with a very small HTTP response stored in a variable for us to test
on:

```ruby
raw_http_body = <<-BODY.rstrip
Just the body...
BODY

raw_http_response = <<-RESP.rstrip
HTTP/1.1 200 Ok\r
Connection: close\r
Content-Length: #{raw_http_body.bytesize}\r
\r
#{raw_http_body}
RESP
```

The above is a little bit weird but is a minimum reasonable HTTP response. All
lines are approprietly terminated with both a carriage return (explicit) and
a newline (implicit in how the strings are defined). The `Content-Length`
header is the exact number of bytes present in the body (thus the two `#rstrip`
calls). The `Date` header was omitted due to this line in [RFC7231][1]

> An origin server MUST NOT send a Date header field if it does not have a
> clock capable of providing a reasonable approximation of the current instance
> in Coordinated Universal Time.

...Which the content of this static site does not have.

With our minimal response out of the way how do we go about parsing it? The
[Ruby 2.5.1 stdlib documentation][2] doesn't specify how it can be created by
end users which usually means it isn't intended for use by users of the
language directly and digging through the Ruby source, you'll see this is
precisely the case. Which means ***Ruby does not have a HTTP response parser
available in it's standard library***. This is pretty frustrating, but maybe it
can be worked around.

How does the `Net::HTTP` library make use of it? Even if the methods aren't
listed for public documentation they're still public APIs on the class and
should be able to be used without monkey patching right? The response is setup
in [the connect method of Net::HTTP][3] and it comes down to a few relevant
lines that can be summarized as:

1. Open a socket to the webserver
2. Write the formatted request to the socket
3. Pass the socket to `HTTPResponse#read_new`

So we need a socket like object containing our response, which we can do with
`StringIO` and pass it to the appropriate method. Let's see what happens:

```ruby
require 'net/http'
require 'stringio'

resp_io = StringIO.new(raw_http_response)
response = Net::HTTPResponse.read_new(resp_io)
```

We get a raised exception:

> Net::HTTPBadResponse: wrong status line: "HTTP/1.1 200 Ok\r\n"

That is definitely a valid status line, so what is going on here? Back to
Ruby's source code... `Net::HTTPResponse#read_new` starts off by calling
`Net::HTTPResponse#read_status_line` which uses this regex for extracting and
checking the validity of the status line:

```ruby
/\AHTTP(?:\/(\d+\.\d+))?\s+(\d\d\d)(?:\s+(.*))?\z/in
```

I had never seen the `/n` modifier for Ruby's regular expressions and it seems
to be completely undocumented. This turned out to be a red herring as it simply
sets `Regexp::NOENCODING` (had to dig into the
[spec/ruby/core/regexp/options_spec.rb][4] file to figure that one out).

So why isn't that regular expression matching? Spoiler: It's the newline (the
carriage return is fine). That is a violation of the HTTP spec, but it is
working normally for Ruby's HTTP requests so what gives? Apparently we have to
go deeper...

It's getting the header string by calling `#readline` which on standard [IO][5]
objects returns the newline (The `IO` class if the base for `StringIO`, and
`Socket` objects in addition to many others). In [Ruby 2.4][6] and later there
is a chomp flag that changes this behavior but it isn't being used in this
case, and it would take the carriage return with it if it was.

So... We must not be operating on an actual `IO` subclass... And sure enough,
`Net::HTTP#connect` after getting the raw socket wraps it in a
`Net::BufferedIO` object which is another internal hidden class. You can see
the definition [of it here][7] and here is its `#readline` method:

```ruby
def readline
  readuntil("\n").chop
end
```

Yep, for some reason this one private internal API has decided to complicate a
Ruby standard API convention and strip off the trailing carriage return and new
line. Wrapping our `StringIO` object in a `BufferedIO` object does solve this
problem but there is no reason for these complications...

```ruby
resp_io = StringIO.new(raw_http_response)
buf_io = Net::BufferedIO.new(resp_io)
response = Net::HTTPResponse.read_new(buf_io)
```

Or does it?

```ruby
response.body
# NoMethodError: undefined method `closed?' for nil:NilClass
```

We need to pull one more trick from the `Net::HTTP#transport_request` to get
the body. The first line actually returns the body, but we want to treat this
like a normal HTTPResponse so we want to make sure the `#body` method works:

```ruby
response.reading_body(buf_io, true) { yield res if block_given? }
response.body
```

There are a couple of differences still from a normal response body. The only
one of particular note to me is that normally the response get it's `#uri` data
from the request. This isn't available with the response alone but can be set
pretty easily:

```
require 'uri'
response.uri = URI.parse('http://example.tld')
```

Altogether this is what it looks like:

```ruby
require 'net/http'
require 'stringio'
require 'uri'

raw_http_body = <<-BODY.rstrip
Just the body...
BODY

raw_http_response = <<-RESP.rstrip
HTTP/1.1 200 Ok\r
Connection: close\r
Content-Length: #{raw_http_body.bytesize}\r
\r
#{raw_http_body}
RESP

resp_io = StringIO.new(raw_http_response)
buf_io = Net::BufferedIO.new(resp_io)

response = Net::HTTPResponse.read_new(buf_io)
response.reading_body(buf_io, true) { yield res if block_given? }
response.uri = URI.parse('http://example.tld')

# You now have a valid Net::HTTPResponse object
```

[1]: https://tools.ietf.org/html/rfc7231#section-7.1.1.2
[2]: https://ruby-doc.org/stdlib-2.5.1/libdoc/net/http/rdoc/Net/HTTPResponse.html
[3]: https://github.com/ruby/ruby/blob/v2_5_1/lib/net/http.rb#L958
[4]: https://github.com/ruby/ruby/blob/3527c05a8f4e189772cdac17f166bd9626c24661/spec/ruby/core/regexp/options_spec.rb
[5]: http://ruby-doc.org/core-2.5.1/IO.html#method-i-readline
[6]: https://blog.bigbinary.com/2017/03/07/io-readlines-now-accepts-chomp-flag-as-an-argument.html
[7]: https://github.com/ruby/ruby/blob/v2_5_1/lib/net/protocol.rb#L81
