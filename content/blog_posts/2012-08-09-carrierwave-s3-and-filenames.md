---
created_at: 2012-08-09 20:00:57+00:00
updated_at: 2012-08-09 20:00:57+00:00
kind: article
title: 'CarrierWave, S3 and Filenames'
tags:
- development
- ruby
- websites
---

This is going to be a real quick post. I'm using the "carrier_wave" gem with
"fog" for one of my projects and found that when a file is stored on S3 the
"identifier", and "filename" methods return nil. I got around this issue in two
separate ways neither of which I'm particularly happy about.

Outside of the uploader, you can use the File utility and the URL of the object
to get the base filename like so:

```ruby
File.basename(Model.asset.url)
```

If you try and do this within the uploader itself like this:

```ruby
File.basename(self.url)
```

It will work, but not when creating additional versions such as thumbnails as
the file hasn't actually been created yet so a URL can't be built and you'll
get an error trying to perform File.basename(nil). You'd need to go back up to
the model and get the normal version's URL like so:

```ruby
File.basename(self.model.asset.url)
```

Now if you're trying to get the file name to build part of the store_dir,
you've just created an infinite loop! Ruby will be happy to tell you that the
stack level too deep (SystemStackError). So ultimately how did I end up getting
it into my store_dir?

```ruby
self.model.attributes["asset"]
```

The file name gets stored raw directly in the database, and thus you can pull
it out by accessing the value directly without going through the accessor that
get overridden by CarrierWave. I'm pretty sure this is a bug, and will report
it with example code and a test (as is appropriate for any bug report *hint*)
as soon as my dead line has passed. 

