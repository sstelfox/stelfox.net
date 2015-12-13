---
date: 2014-02-20 07:48:24 -0500
slug: "finding-ruby-subclasses"
tags:
- ruby
title: "Finding Ruby Subclasses"
---

While working through a problem I found it would be immensely useful to be able
to enumerate all of the current subclasses of a particular class. After
thinking about this for a while I settled on a good old friend of mine,
`ObjectSpace`.

For those not familiar with the ObjectSpace module, it is a means to inspect
and access the items being tracked by Ruby's garbage collector. This means it
has a hook into every living object, and more dangerously, every near-death
object.

`ObjectSpace` provides a method for enumerating instances of a specific class,
specifcally named `each_object` which takes a class. With Ruby all classes are
in fact instances of the `Class` class. This allows us to enumerate every
available class by passing it to the enumerator like so:

```ruby
ObjectSpace.each_object(Class).to_a
```

Alright so we now have an array of every single class that could possibly be
instantiated, how do we narrow it down to just the ones we're interested in?
Once again Ruby provides with the `ancestors` method, combine that with a
select and we can quickly narrow it down. You can see it in the following
example:

```
[1] pry(main)> TargetSubclass = Class.new(String)
=> TargetSubclass
[2] pry(main)> ObjectSpace.each_object(Class).select { |k| k.ancestors.include?(String) }
=> [String, TargetSubclass]
```

Hmm, that's not quite right though. We have found all the subclasses but we've
also grabbed the parent class. With one small modification we eliminate that as
well.

```
[1] pry(main)> TargetSubclass = Class.new(String)
=> TargetSubclass
[2] pry(main)> ObjectSpace.each_object(Class).select { |k| k.ancestors.include?(String) && k != String }
=> [TargetSubclass]
```

That line is rather long though, and I generally like to avoid multiple tests
in a select block. There is a tad bit of syntactic sugar provided by Ruby
allowing us to accomplish the same thing, our final example is ultimately the
solution I went with:

```
[1] pry(main)> TargetSubclass = Class.new(String)
=> TargetSubclass
[2] pry(main)> ObjectSpace.each_object(Class).select { |k| k < String }
=> [TargetSubclass]
```

Putting this into a method:

```ruby
def subclasses(klass)
  ObjectSpace.each_object(Class).select { |k| k < klass }
end
```

If you were so inclined you could extend the `Class` class with a method to
make this available anywhere like so:

```ruby
class Class
  def self.subclasses
    ObjectSpace.each_object(Class).select { |k| k < self }
  end
end
```

I'm personally not a fan of extending any of the core classes unless absolutely
necessary, but too each there own.
