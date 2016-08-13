---
title: GPG Keypairs
type: note
---

# GPG Keypairs

## Use of subkeys

Sources:

* https://alexcabal.com/creating-the-perfect-gpg-keypair/
* http://www.phillylinux.org/keys/terminal.html
* https://wiki.debian.org/subkeys
* http://tjl73.altervista.org/secure_keygen/en/en.html

Subkeys are important as they can prevent the full loss of identity in the
event a laptop is stolen or compromised. A master keypair should be isolated
via airgap (stored on a USB stick and only used on a non-network enabled Live
CD for example).

Create initial keypair:

NOTE TO SELF: Try adding `--digest-algo SHA256` to the following command as it
seems it will use SHA1 for the key signature by defualt (I dont know if this
will work).

```
[user@host ~]$ gpg --gen-key
```

* Choose 1 RSA and RSA (default)
* Keysize: 4096
* 0 (Key does not expire -> see Key expiration)
* Provide name (Sam Stelfox)
* Provide email (sam@stelfox.net)
* No comment
* Verify information is correct
* Provide a strong passphrase

At the end it will let you know what your key ID is as 8 hexidecimal characters
(hint: look for the line that says "marked as ultimately trusted"). You will
want to replace any instances of `<keyid>` in future steps with this value.

At this point we have the master key which will be used to generation of the
sub-keys. Signing other peoples keys should be done with the master keypair to
prevent signature expiration when a subkey expires.

I have an alternate email address that Id like to keep associated with this key
as well so I added another identifier like so:

```
[user@host ~]$ gpg --edit-key <keyid>
gpg> adduid
```

* Provide real name
* Alternate email address
* Comment (optional)
* Verify the information is accurate
* Provide your password

I also like to explicitely list the keyserver pools that I use to make updates
to my keys easier to find. This is done with the following command:

NOTE TO SELF: The following is untested.

```
gpg> keyserver hkp://pool.sks-keyservers.net
```

For key-completeness I choose to add a picture to my master (and thus
subsequent keys) of myself. A few things to note about the picture, its best to
use a smaller image as the image will increase the size of your public key, but
you should still be visible and identifiable within it.

Make sure you choose a picture you feel is appropriate, you need to
redistribute the public key to everyone that has ever received it to get rid of
the older version. I chose to use a 200x200px image in JPG format.

I also saved the JPG at a lower quality (50%), disabled progressive
enhancement, enabled optimization, changed subsampling to 4:4:4, smoothing to
0.30 and removed the comments, this resulted in a filesize of 5.2Kb.

I also used the `exif` tool to verify that it had no EXIF/Metadata within the
image itself as the whole file would be stored within the public key and I
didnt wish to reveal anything inside the key I didnt explicitely add.

```
gpg> addphoto ~/Pictures/headshot_small.jpg
```

It conviniently opens up the image in a preview window before confirming the
image is correct. It will confirm your passphrase then add it too your key.
Finally save the changes:

```
gpg> save
```

We want to prefer stronger hashes and ciphers. You should do extensive personal
research on what you prefer. The ciphers your version of gpg supports should be
at the top of the output of `gpg -h` for me it was the following:

```
[user@host ~]$ gpg -h
<snip>
Supported algorithms:
Pubkey: RSA, RSA-E, RSA-S, ELG-E, DSA
Cipher: IDEA, 3DES, CAST5, BLOWFISH, AES, AES192, AES256, TWOFISH,
        CAMELLIA128, CAMELLIA192, CAMELLIA256
        Hash: MD5, SHA1, RIPEMD160, SHA256, SHA384, SHA512, SHA224
        Compression: Uncompressed, ZIP, ZLIB, BZIP2
<snip>
```

I personally recommend AGAINST the following ciphers: IDEA, 3DES, CAST5,
BLOWFISH. As well as the MD5 hash method. You may also want to remove SHA1 from
your preferences as it too may be broken in the forseable lifetime of your key,
for the same reason I chose to drop the 128 key-bit versions of AES and
CAMELLIA (I almost dropped AES192 as there are attacks known to reduce the
keysize to just above 128 but decided against it for compatibility with other
clients) I use the following preferences on my personal public key:

```
[user@host ~]$ gpg --edit-key <keyid>
gpg> setpref SHA512 SHA384 SHA256 SHA224 RIPEMD160 CAMELLIA256 AES256 CAMELLIA192 AES192 CAMELLIA128 ZLIB BZIP2 ZIP Uncompressed
gpg> save
```

The sad thing was that it didnt want to remove 3DES from my list of preferred
ciphers. Im guessing the idea behind this was too provide a common fallback in
the event that the other encryption algorithms arent available to the other
person. This isnt the best solution for me, there are a lot of times when I
would prefer to not send information at all rather than quietly use an insecure
algorithm and assume my message is protected.

Ultimately this looks like its a fault of RFC conformance. RFC4880, section 9.2
specifies OpenPGP implementations MUST implement TripleDES and then in section
13.2 states "if it is not explicitly in the list, it is tacitly at the end.
However, it is good form to place it there explicitly."

Apparently its the same for SHA1.

Alright lets create our signing subkey:

```
[user@host ~]$ gpg --edit-key <keyid>
gpg> addkey
```

* Provide your passphrase
* Choose 4 RSA (sign only)
* Choose 4096 bit key
* Set expiration of 13 months (13m), and accept the verification.
* "Really create?" y

You may also want to create a subkey for encrypting / decrypting content. This
isnt always valuable as once the key expires youll still need to keep the
private key around to decrypt content for that key. I choose to deal with this
so I will:

* Provide your passphrase
* Choose 5 Elgamal (encrypt only)
* Choose 4096 bit key
* Set expiration of 13 months (13m), and accept the verification
* "Really create?" y

A note on Elgamal. I chose it for my encryption key not because RSA is any less
secure, but because there is more active (public) work going on to break
factoring algorithms than discrete logarithm problems. This doesnt mean an
advancement in factoring wouldnt weaken Elgamals log based approach but it
would at the very least be less direct.

Ive also been told Elgamal is more universally compatible with PGP
implementations for an added bonus (though I dont know anything about the
accuracy).

Make sure you save the new keys:

```
gpg> save
```

We also want to generate a pre-generated revocation of our keys just in case
the unthinkable happens to it, or we lose the password, anything that would
make our key compromised for use. This doesnt publish the CRL, just creates a
file that can be used at a later date.

It is important that this be stored separately and just as securely as the
master key (which we will be exporting later).

```
[user@host ~]$ gpg --output <keyid>.gpg.crl --gen-revoke <keyid>
```

It will ask you about generating the revocation and the reason. This CRL should
only be used in the event you lose access to your master key for some reason.
There isnt a particularily good pre-defined reason for the revocation so I go
ahead with the 'worst' which is the key has been compromised.

I also chose to add the following description to the revocation as it provides
enough information to people with my keys to understand why this CRL might have
been used:

> Master key needed to be revoked due too loss of password, access, or
> compromise. This was a pregenerated CRL, please contact me for more
> specifics.

Before going any further, secure this file.

Now lets create a backup of the master keypair:

```
[user@host ~]$ gpg --export-secret-keys --armor <keyid> > <keyid>.private.gpg-key
[user@host ~]$ gpg --export --armor <keyid> > <keyid>.public.gpg-key
```

These two files are your private and public portions of your key, keep these
just as secure as the CRL and ideally in a different location. Dont keep them
on your laptop or other mobile devices, perferrably off any network enabled
device as well.

Now we need to transform our keypairs into the ones that are safe for use on my
laptops and other mobile devices. First we will export all the subkeys into a
file:

```
[user@host ~]$ gpg --export-secret-subkeys <keyid> > subkeys
[user@host ~]$ gpg --delete-secret-key <keyid>
```

The deletion will verify you REALLY want to do this twice, yes you do. You did
backup your keys right? Now we will import the subkeys again and clean up the
file.

```
[user@host ~]$ gpg --import subkeys <keyid>.public.gpg-key
[user@host ~]$ shred -n 6 -u subkeys
```

You can verify that the master signing subkey is not in the keypair in the
keyring by running `gpg -K`. The first line should have a `sec#` instead of
`sec` indicating the private key is missing.

You can now upload your public key to the various key server pools. I use the
following command to upload mine:

```
[user@host ~]$ gpg --send-key --keyserver hkp://pool.sks-keyservers.net <keyid>
```

## Exchanging Keys with Others

Get your fingerprint, and write it down, print it out, put it on your business
card, some physical means of providing it too others. You can get your
fingerprint with the following command:

```
[user@host ~]$ gpg --fingerprint <keyid>
```

Also note down the keyservers that you use as they may be using a pool that
isnt synced with yours.

Collect other peoples names, key IDs, and keyservers. When back at your
air-gapped box with your MASTER keypair present, receive, sign and provide them
with their signature files (email works since you now have their keys). The
following example will use a friends key ID of E4758D1D:

```
[user@host ~]$ gpg --recv-keys E4758D1D --keyserver <their-keyserver>
[user@host ~]$ gpg --sign-key E4758D1D
[user@host ~]$ gpg --armor --output E4758D1D.signed-by.<keyid>.asc --export E4758D1D
```

You will want to import these exported signatures into your laptop keyring and
any signatures you get back on your key into both your laptop keyring and the
master keyring like so:

```
[user@host ~]$ gpg --import E4758D1D.signed-by.<keyid>.asc
[user@host ~]$ gpg --import <keyid>.signed-by.E4758D1D.asc
```

Once you have received the signatures you will want to update your key on the
keyservers so it includes the signatures.

```
[user@host ~]$ gpg --send-key --keyserver hkp://pool.sks-keyservers.net <keyid>
```

## In the Event of Compromise

If you need to revoke subkeys, get your master keypair out and import it with
the following commands:

```
[user@host ~]$ gpg --import <keyid>.public.gpg-key <keyid>.private.gpg-key
```

Iteractively revoke the subkeys:

```
[user@host ~]$ gpg --edit-key <keyid>
gpg> key 1
gpg> key 2
gpg> key 3
gpg> revkey
gpg> save
```

It will ask your for the reason, a comment, and your passphrase. You will need
to send the updated keys to the keyserver and go through the generation process
again for subkeys.

## Key Expiration

Additional Sources:

* http://madduck.net/blog/2006.06.20:expiring-gpg/
* http://sun4you.org/kobaan/RW/files/kobaan-gpg-expired-keys-cleanup-howto.html

So key expiration is one of the things I had to research the best practices
for. It seems there are a few schools of thought.

The first and seemingly most obvious is too set an expiration on all of your
keys. This has the consequence of forcing you to either edit the expire date or
create a new master key. Either way the public portion of your key has to be
re-issued. This also expires and disconnects all your signatures forcing you to
resign and redistribute those as well.

The second is at the opposite extreme. No key should ever expire, if your key
is compromised you should be able to issue CRLs and expire it manually. This is
far from best practice in any PKI situation but is easier to handle. The
immediate cost is that people will trust all signatures, and encrypted content
from your compromised key until they retrieve the revocation from any
keyservers, which in some cases is longer than a key should rightfully exist
(or not at all).

The third and final option is the one Im personally most preferential too.
Allow the master key to never expire, but have a reasonable expiration time on
all subkeys (1-2 years). Ensure signatures of other users keys are done with
the master key. Keep the master isolated across an airgap and encrypted.

Only subkeys and the public portion of the master should exist on any machine
besides the dedicated airgap. This allows for the subkeys to expire
automatically without the rediculous hassle of having to re-sign all trusted
peers keys.

## Useful commands

I used the following commands on an exported private key to see the contents
and verify the subkeys were also included:

```
[user@host ~]$ gpg --dry-run -vvv --allow-secret-key-import --import <keyid>.private.gpg-key
```

Viewing signatures on a key:

```
[user@host ~]$ gpg --list-sigs <keyid>
```

