---
date: 2014-02-17 15:28:27 -0500
slug: creating-crypt-style-sha512-passwords-with-ruby
tags:
- development
- linux
- ruby
- security
title: Creating Crypt Style SHA512 Passwords With Ruby
---

I needed to generate crypt-style SHA512 passwords in ruby for an `/etc/shadow`
file. After a bunch of Googling and messing around with the OpenSSL library I
finally found a very simple built-in way to handle this.

```ruby
require 'securerandom'

'password'.crypt('$6$' + SecureRandom.random_number(36 ** 8).to_s(36))
```

You'll get a string that looks like:

```
$6$4dksjo1b$Lt194Dwy7r/7WbM8MezYZysmGcxjaiisgTrTBbHkyBZFXeqQTG0J5hep4wLM/AmYxlGNLRy0OWATLDZCqjwCk.
```

If you don't want to use the `SecureRandom` module you can replace the random
call with simply `rand(36 ** 8)` though this isn't recommended.

Enjoy!
