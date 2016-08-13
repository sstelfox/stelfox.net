---
title: Password Security
tags:
- passwords
- security
type: note
---

## Random Password Generation

This little ruby snippet generates a random 31 character string consisting of
uppercase letters, lowercase letters, and numbers.

```ruby
#!/usr/bin/env ruby

character_set =  [('a'..'z'),('A'..'Z'),(0..9)].map do |item|
  item.to_a
end
character_set.flatten!

password = ""
31.times do
  password += character_set[rand(character_set.length)].to_s
end

puts password
```

## Shamir's Secret Sharing Scheme

Citing from the Wikipedia article about Secret Sharing:

```
In cryptography, a secret sharing scheme is a method for distributing a secret
amongst a group of participants, each of which is allocated a share of the
secret. The secret can only be reconstructed when the shares are combined
together; individual shares are of no use on their own.

More formally, in a secret sharing scheme there is one dealer and n players.
The dealer gives a secret to the players, but only when specific conditions are
fulfilled. The dealer accomplishes this by giving each player a share in such a
way that any group of t (for threshold) or more players can together
reconstruct the secret but no group of less than t players can. Such a system
is called a (t,n)-threshold scheme.

A popular technique to implement threshold schemes uses polynomial
interpolation ("Lagrange interpolation"). This method was invented by Adi
Shamir in 1979.

Note that Shamir's scheme is provable secure, that means: in a (t,n) scheme one
can prove that it makes no difference whether an attacker has t-1 valid shares
at his disposal or none at all; as long as he has less than t shares, there is
no better option than guessing to find out the secret.
```

There is a fedora package named `ssss` that can split a string up to 128
characters long into X pieces, requiring at least Y pieces to recover it.
Assuming the pieces are broken up over several different locations and stored
in different manners it's a fairly strong way to store passwords or other
information that needs to be written once and recovered rarely.  The following
example uses X = 5, and Y = 3:

```
[root@localhost ~]# ssss-split -t 3 -n 5
Generating shares using a (3,5) scheme with dynamic security level.
Enter the secret, at most 128 ASCII characters: my secret root password
Using a 184 bit security level.
1-1c41ef496eccfbeba439714085df8437236298da8dd824
2-fbc74a03a50e14ab406c225afb5f45c40ae11976d2b665
3-fa1c3a9c6df8af0779c36de6c33f6e36e989d0e0b91309
4-468de7d6eb36674c9cf008c8e8fc8c566537ad6301eb9e
5-4756974923c0dce0a55f4774d09ca7a4865f64f56a4ee0
```

You make get the following error message as well which is safe to ignore as
long as you're on a fully trusted system, and are the only user of such system.

```
WARNING: couldn't get memory lock (ENOMEM, try to adjust RLIMIT_MEMLOCK!).
```

To recover the example above, we need to tell it that we need 3 (being our Y)
of the pieces to recover the password and it can be accomplished like so:

```
[root@localhost ~]# ssss-combine -t 3
Enter 3 shares separated by newlines:
Share [1/3]: 3-fa1c3a9c6df8af0779c36de6c33f6e36e989d0e0b91309
Share [2/3]: 5-4756974923c0dce0a55f4774d09ca7a4865f64f56a4ee0
Share [3/3]: 2-fbc74a03a50e14ab406c225afb5f45c40ae11976d2b665
Resulting secret: my secret root password
```
