---
date: 2013-12-07 18:20:58 -0500
tags:
- coffeescript
- javascript
- web
- programming
slug: "access-get-parameters-with-coffeescript"
title: "Access GET Parameters With Coffeescript"
---

I've been working on a pure javascript based search engine for this static
website and needed to access a get parameter within the URL.

I found a few solutions online but they usually made use of jQuery or weren't
in coffeescript. A few others would only extract an individual named parameter
at a time. The following will return all of them in Javascript's equilvalent of
a hash (or dictionary if you prefer) in the form of an object.

```coffeescript
getParams = ->
  query = window.location.search.substring(1)
  raw_vars = query.split("&")

  params = {}

  for v in raw_vars
    [key, val] = v.split("=")
    params[key] = decodeURIComponent(val)

  params

console.log(getParams())
```

If compiled and included in a page the above will print out the parameters as a
hash object to the console.
