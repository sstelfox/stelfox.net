---
date: 2014-05-28 18:00:55 -0400
slug: pg-error-error-type-hstore-does-not-exist
tags:
- postgres
- ruby
title: "PG::Error: ERROR: Type 'Hstore' Does Not Exist"
---

I've been using the PostgreSQL's hstore extension in a Rails application lately
and kept encountering the error that is this post's namesake. It would
specifically happen when a database had been dropped, recreated and I freshly
ran the migrations.

It seems that while Rails 4 supports the HStore datatype, it doesn't enable the
extension itself. I've found two ways too solve this issue in wildly different
ways.

## First Solution: Enable HStore by Default

This is the common solution that is recommended too solve this issue. It
enables the HStore extension by default on all newly created databases. Too
understand this you need to know a bit about PostgreSQL's behavior.

When a new database is created, PostgreSQL creates a copy of a special
pre-existing database named 'template1' by default. Anything done too this
database will be reflected in all new databases, including enabling extensions.

Too enable the HStore extension on the `template1` database you can execute the
following command (generally as the postgres user or with your authentication
of choice).

```
psql -d template1 -c 'CREATE EXTENSION hstore;'
```

## Second Solution: Rails Migration

The above solution doesn't sit well with me. While it's uncommon for any
individual PostgreSQL server to be shared among different applications with
different databases, the possibility is there. Perhaps the application will get
de-commisioned and the DBA will simply drop the associated database and roles
instead of setting up a new one.

Disconnecting the requirements of the application from the application itself
always seems to lead too trouble.

Rails already has a mechanism too handle modifications too the database
overtime, migrations. They're solid, well tested, and encapsulate not only how
to get the database to a particular state but also how to return it back to
it's prior state (generally).

We can also do this without using raw SQL which now also seems a bit... off to
me. The following is a sample Rails migration that will both enable and disable
the extension:

```ruby
class ManageHstore < ActiveRecord::Migration
  def change
    reversible do |op|
      op.up { enable_extension 'hstore' }
      op.down { disable_extension 'hstore' }
    end
  end
end
```

Now the biggest problem with this migration is that too use it, you need too
plan ahead of time too use the extension or not worry about freshly running all
the migrations (generally because you dropped and created the database). This
migration needs to be named so it alphabetically comes before any migration in
your application that makes use of the HStore datatype.

ActiveRecord uses timestamps at the beginning of the migration names to handle
this alphabetic sorting, and such you'll want to fake this in before you used
the HStore datatype.
