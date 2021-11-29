---
title: Access GET Parameters With Coffeescript
date: 2013-12-07T18:20:58-05:00

aliases:
  - /blog/2013/12/access-get-parameters-with-coffeescript/
slug: access-get-parameters-with-coffeescript

taxonomies:
  tags:
  - development
---

I've been working on a pure javascript based search engine for this static
website and needed to access a get parameter within the URL.

<!-- more -->

I found a few solutions online but they usually made use of jQuery or weren't
in coffeescript. A few others would only extract an individual named parameter
at a time. The following will return all of them in Javascript's equivalent of
a hash (or dictionary if you prefer) in the form of an object.

```
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
