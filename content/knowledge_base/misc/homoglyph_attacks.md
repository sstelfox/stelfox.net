---
title: Homoglyph Attacks
---

# Homoglyph Attacks

A [homoglyph][1] attack is making use of common UTF-8 high order characters
that look virtually identical to different ASCII characters. For example
decimal character 1029 looks like an uppercase S. Demonstrated in the following
snippet:

ЅS

The first character is actually the unicode version. It is very easy to verify
this in a ruby interpreter shell by issueing the following commands:

```ruby
[1] pry(main)> 1029.chr('UTF-8')
=> "Ѕ"
[2] pry(main)> _.ord
=> 1029
```

[1]: http://www.irongeek.com/homoglyph-attack-generator.php

