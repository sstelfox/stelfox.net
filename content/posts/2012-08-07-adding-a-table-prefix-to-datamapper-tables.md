---
date: 2012-08-07 14:09:33+00:00
slug: adding-a-table-prefix-to-datamapper-tables
tags:
- development
- ruby
title: Adding a Table Prefix to DataMapper Tables
type: post
---

So I recently encountered a situation where I needed to define a prefix on the
tables used by the "data_mapper" gem. When I went searching I found quite a bit
of information about similar projects in Python, and PHP named DataMapper but
nothing about the ruby "data_mapper". The search continued eventually ending in
my reading through the source of the data_mapper gem only to find that there
was no feature for simply defining a prefix.

Reading through the source though did allow me to find any easy way to
implement such functionality. The following snippet is a minimalistic
data_mapper initialization and setup of one model with a table prefix of
"source_" (chosen at random and of no significance).

```ruby
# encoding: utf-8

# (1)
require "dm-core"
require "dm-migrations"

# (2)
module PrefixNamingConvention
  def self.call(model_name)
    # (3)
    prefix = "source_"
    # (4)
    table_name = DataMapper::NamingConventions::Resource::UnderscoredAndPluralized.call(model_name)

    "#{prefix}#{table_name}"
  end
end

# (5)
DataMapper::Logger.new($stdout, :debug)

# (6)
DataMapper.setup(:default, "sqlite:example.db")
DataMapper.repository(:default).adapter.resource_naming_convention = PrefixNamingConvention

# (7)
class Person
  include DataMapper::Resource

  property :id, Serial
  property :first_name, String
  property :last_name, String
  property :email, String
end

# (8)
DataMapper.finalize
DataMapper.auto_upgrade!
```

So here are some notes on what's going on in this snippet. Each area that I
will be discussing has been annotated with a number like "# (1)" to make it
easier to find a section you have questions about.

1. Since this is an example I'm only including the bare minimum data mapper
   gems to accomplish the task. If you're using bundler you may need to also
   require "rubygems" to get this too work.
2. This is where the real work happens, DataMapper uses external modules that
   receive the "call" method to handle the conversion of class names to table
   names. By default DataMapper uses the module
   "DataMapper::NamingConventions::Resource::UnderscoredAndPluralized", which
   I'll use later to maintain the same names.
3. This is where I'm defining the table prefix. This could be defined in a
   global, call another method or class, whatever your heart desires to get a
   string that will be used as a prefix.
4. Here I'm getting what DataMapper would have named the table if I wasn't
   interferring
5. I'm logging to standard out so that I can see the queries called to verify
   that DataMapper is creating tables with the names that I want. This is used
   later on in this post to demonstrate this solution working, however, it
   could be left out without affecting anything.
6. Initial setup of a sqlite database, and then the good stuff. Once a database
   has been setup with a specific adapter you can change the naming convention
   DataMapper will use to generate table names. This is accomplished by passing
   the module constant name through the repositories adapter and too
   "resource_naming_convention" as demonstrated in the code.
7. Here I'm defining an example model of no importance. This is purely for
   demonstration, normally DataMapper would name this model "people".
8. Inform DataMapper we're done setting it up and to run the migrations to
   create the model defined.

When you run this ruby file (assuming you have the "data_mapper" and
"dm-sqlite-adapter" gem installed) you'll see output very similar too this:

```
~ (0.001402) PRAGMA table_info("source_people")
~ (0.000089) SELECT sqlite_version(*)
~ (0.077840) CREATE TABLE "source_people" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "first_name" VARCHAR(50), "last_name" VARCHAR(50), "email" VARCHAR(50))
```

Notice the third line? Specifically the name of the table? It's named exactly
as it would have been except now it has a prefix of "source_".

Hope this saves someone else some trouble. Cheers!
