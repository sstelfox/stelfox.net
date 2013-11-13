---
created_at: 2012-08-08 15:06:56+00:00
kind: article
title: 'Security Through Obesity'
tags:
- development
- ruby
- websites
---

Jeremy Spilman recently [proposed changes][1] to how user's hashes are stored
in website's and companies databases.  This post was originally going to look
at some of the issues involved in the scheme he envisioned, however, he rather
quickly posted a [followup article][2] with a well thought out solution that
countered all of the issues that other people and myself were able to come up
with. I'd strongly recommend reading both if you haven't done so. Instead of
announcing flaws, I'm turning this into a post with a simple functional
implementation of the described scheme in Ruby using DataMapper.

At first I'd like to point out that this is one of those few examples where a
form of security through obscurity is actually increasing not only the
perceived security but the cost to attack a system as well.

Please note this code is a minimal, functional, example and should not be used
in production. It is missing a lot of things that I personally would add before
attempting to use this but that is an exercise for the reader. It is licensed
under the MIT license. I'll walk through the code briefly afterwards going over
some bits.

```ruby
# encoding: utf-8

require "rubygems"           # You only need this if you use bundler
require "dm-core"
require "dm-migrations"
require "dm-sqlite-adapter"
require "dm-validations"
require "scrypt"

DataMapper.setup :default, "sqlite:hash.db"

class User
  include DataMapper::Resource 

  property :id,             Serial
  property :username,       String, :required => true,
                                    :unique => true 
  property :crypt_hash,     String, :required => true,
                                    :length => 64
  property :salt,           String, :required => true,
                                    :length => 25 

  def check_password(plaintext_password)
    encrypted_hash = scrypt_helper(plaintext_password, self.salt)
    hash_obj = SiteHash.first(:crypt_hash => encrypted_hash)

    if hash_obj.nil?
      puts "Invalid password"
      return false
    end

    verification_hash = scrypt_helper(plaintext_password, hash_obj.salt)

    if self.crypt_hash == verification_hash
      return true
    else
      puts "WARNING: Found matching hash, but verification failed."
      return false
    end
  end

  def password=(plaintext_password)
    generate_salt

    encrypted_password = SiteHash.new
    encrypted_password.crypt_hash = scrypt_helper(plaintext_password,
                                                  self.salt)
    encrypted_password.save

    self.crypt_hash = scrypt_helper(plaintext_password,
                                    encrypted_password.salt)
  end

  private

  def generate_salt
    self.salt = SCrypt::Engine.generate_salt(:max_time => 1.0)
  end

  def scrypt_helper(plaintext_password, salt)
    SCrypt::Engine.scrypt(plaintext_password, salt,
                          SCrypt::Engine.autodetect_cost(salt),
                          32).unpack('H*').first
  end
end

class SiteHash
  include DataMapper::Resource

  property :id,             Serial
  property :crypt_hash,     String,   :required => true,
                                      :length => 64
  property :salt,           String,   :required => true,
                                      :length => 25

  def initialize(*args)
    super
    generate_salt
  end

  private

  def generate_salt
    self.salt = SCrypt::Engine.generate_salt(:max_time => 1.0)
  end
end

DataMapper.finalize
DataMapper.auto_upgrade!
```    

I tried to keep this as a simple minimum implementation without playing golf.
Strictly speaking the validations on the data_mapper models aren't necessary
and could have been removed, in this case, however, the length fields do
actually indicate a bit more of what you might expect to see in the database,
while the requires are just good habits living on.

Both of the two models are required to have both a salt and a hash, the name
'crypt_hash' was chosen do too a conflict with one of data_mapper's reserved
words 'hash', the same goes for the model name, however, that class comes from
elsewhere. Raw scrypt'd hashes are 256 bits long or 64 hex characters long,
while the salts are 64 bits (16 hex characters) plus some meta-data totaling 25
  hex characters in this example.

Salts are hashes are computed by the 'scrypt' gem. In this example I've bumped
up the max time option to create a hash from the default of 0.2 seconds up to 1
second. This is one of those things that I could have left out as the default
is fine for an example, but it also couldn't hurt slightly increasing it in
case someone did copy-paste this into production.

The one thing that I'd like to point out is a couple of 'puts' statements I
dropped in the check_password method on the User model. The first one simply
announces an invalid password. A lot of these could indicate a brute force
attack. The second one is more serious, it indicates that there is either a bug
in the code, a hash collision has occurred, or an attacker has been able to
drop in hash of their choosing into the site_hashes table, but haven't updated
the verification hash on the user model yet. I'd strongly recommend reading
through both of Jeremy's posts if you want to understand how this threat works
and specifically the second post to see how the verification hash protects what
it does.

So how would you use this code? Well you'd want to create a user with a
password and then check if their password is valid or not later on like so:

```ruby
User.create(:username => 'admin', :password => 'admin')
User.first(:username => 'admin').check_password('admin')
```

One of the key ways this separation increases the security of real users's
hashes is by having a large number of fake hashes in the hash table that the
attackers will have to crack at the same time. As a bonus I've written a module
to handle just that for the code I've already provided. Once again this is
licensed under the MIT license and should not be considered production ready.

```ruby
# This is the code above, you can also include everything below
# this in the same file if you're into that sort of thing
require "user_hash_example"

module HashFaker
  def self.fast_hash
    SiteHash.create(:crypt_hash => get_bytes(32))
  end

  def self.hash
    SiteHash.create(:crypt_hash => scrypt_helper(get_bytes(24),
                                                 generate_salt))
  end

  def self.generate_hashes(count = 5000, fast = false)
    count.times do
      fast ? fast_hash : hash
    end
  end

  private

  def self.generate_salt
    SCrypt::Engine.generate_salt(:max_time => 1.0)
  end

  def self.get_bytes(num)
    OpenSSL::Random.random_bytes(num).unpack('H*').first
  end

  def self.scrypt_helper(plaintext_password, salt)
    SCrypt::Engine.scrypt(plaintext_password, salt,
                          SCrypt::Engine.autodetect_cost(salt),
                          32).unpack('H*').first
  end
end
```

[1]: http://www.opine.me/a-better-way-to-store-password-hashes/
[2]: http://www.opine.me/all-your-hashes-arent-belong-to-us/

