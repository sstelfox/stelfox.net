---
date: 2017-10-09 23:35:34+00:00
tags:
- gpg
- linux
- security
title: GPG Process Notes
---

I followed the TAILS setup guide to get a secure offline environment running to
perform this generation task. The steps I took are documented in the tails
document.

## Initial Key Creation

For simplicity I wanted to clear out the GnuPG configuration that starts out in
place. Makes things a lot nicer later on.

```console
rm -rf ~/.gnupg/*
```

I pulled in the .gnupg/gpg.conf from my dotfiles by hand.

And begin the key generation process

```console
gpg --expert --gen-key
```

Choose '8' which is RSA (set your own capabilities). Disable all the
capabilities except for Certify and press 'q' to continue. Use a 4096 bit key.
Set the expiration to 2 years. The certificate can be resigned and republished
with a later expiration date.

Set the personal attributes appropriately, a passphrase and let the key
generation happen. Once done, sub-keys need to be generated. We need to edit
the existing key to create more keys.

```console
gpg --expert --edit-key <email used in key>
```

Add any additional email addresses you might need to the key.

```console
gpg> adduid
gpg> uid 1
gpg> primary
```

Generate the sub keys:

```console
gpg> addkey
```

The above will require the master key's private key. Create another '8' type
key with only the 'Sign' capability and 2048 bits valid for 6 months Do this
again for the encryption and authentication keys. A higher bit usage may be
useful, some smartcards only support 2048, if higher bits are supported 3072 or
4096 may be better.

I cropped and scale an image of myself down to 120x144 (Quality at 50% still
accurately reflected my likeness quite well and came in at 2.8Kb). The image
has to be under 4Kb but the smaller the better. I ended by ensuring the file
was stripped of metadata and minimized as much as I could with `jpegoptim -s`.
It has to be transferred to the secure TAILS environment and then added to the
certificate while in the editkey mode we're currently in at this point in the
tutorial.

Turns out the size can be up to 240x288...

```console
gpg> addphoto
```

And follow the prompts. When everything is good save the changes made:

```console
gpg> save
```

Now I need to setup a backup for all the contents in case they're lost or
displaced. We need to backup the keyrings, a raw copy of the master private
key, a revocation certificate just in case, then the public key.  Backup and
export ~/.gnupg/secring.gpg and ~/.gnupg/pubring.gpg

```console
mkdir ~/gpg_backups
cp ~/.gnupg/{sec,pub}ring.gpg ~/gpg_backups/
gpg -a --export-secret-key sstelfox@bedroomprogrammers.net > ~/gpg_backups/secret_key.gpg
gpg -a --export sstelfox@bedroomprogrammers.net > ~/gpg_backups/publickey.gpg
gpg -a --gen-revoke sstelfox@bedroomprogrammers.net > ~/gpg_backups/revocation_cert.gpg
```

For the revocation key choose 'Key has been compromised' and an empty
description, as that is the intended usage for this particular CRL.

We also want a `paperkey` backup file of the private key.

```console
gpg --export-secret-key sstelfox@bedroomprogrammers.net | paperkey > ~/gpg_backups/paperkey.bak
```

It is expected that the paperkey.bak file is printed out on a piece of
acid-free paper and put someplace very very safe. In the worst possible
scenario, this needs to be hand typed back into a text file. Once done
restoration can be done by pulling in your public key and the typed file like
the following:

```console
paperkey --pubring ~/gpg_backups/publickey.gpg \
  --secrets ~/gpg_backups/paperkey.bak --output ~/recovered_secret.gpg
```

We need to then export just the subkeys for day to day usage. This is a
non-obvious practice.

Take out the subkeys:

```console
gpg -a --export-secret-subkeys sstelfox@bedroomprogrammers.net \
  > ~/gpg_backups/subkey_secrets.gpg
```

Delete the secret keys:

```console
gpg --delete-secret-keys sstelfox@bedroomprogrammers.net
```

You'll need to double confirm the deletion. We now have all the public keys we
want and no secret keys... We need to now import back in just the subkeys.

```console
gpg --import ~/gpg_backups/subkey_secrets.gpg
```

You should see just the subkeys in the the secret ring:

```console
gpg -K
```

We can then export just the 'laptop' keys.

```console
gpg -a --export-secret-keys sstelfox@bedroomprogrammers.net > ~/gpg_backup/laptop_keys_secret.gpg
gpg -a --export sstelfox@bedroomprogrammers.net > ~/gpg_backup/laptop_keys_public.gpg
```

These two files need are what will be transferred to the laptop and other
machines that they are needed. To import the two files:

```console
gpg --import laptop_keys_public.gpg
gpg --import laptop_keys_secret.gpg
```

Laptop keyrings aren't needed with the smartcard assuming the public key
portions are published at the URL set on the smartcard.

## Normal Smartcards

The secret keys are best suited to be stored on a smartcard (such as a YubiKey,
though that needs extra configuration). This assumes that pcscd and libccid are
installed on the system being used. TAILS is already setup for it.

The recommended reader & tokens for this kind of use are OpenPGP Smartcard V2
(with breakout) combined with a Gemalto USB Shell Token V2.

By default these keys have a user & admin key set respectively to 123456 and
12345678. If the user pin is mistyped 3 times the card is blocked until the
admin pin is provided. If the admin pin is provided incorrectly three times the
card will be destroyed. We need to change these from the default like so:

```
gpg --card-edit
> admin
> passwd
```

Change the pin then the admin pin (option 1, then 3 respectively). While in we
should set the url metadata field to provide the location where your public key
can be downloaded. In my case `https://stelfox.net/publickey.gpg` this can be
set using the following command:

```
> url
```

Also a few other bits of metadata:

```
> name
> lang
```

One thing that may be worth considering is the 'Signature PIN' value being set
to 'not forced'. As far as I can tell this is only used to tell the gpg-agent
whether it's allowed to cache the PIN for performing signatures or not.

It will reduce the security of your card if a PIN isn't required for every
signature performed but it make it quite a bit easier to use as part of a
normal workflow. Hostiles won't be able to get the key material but they will
be able to sign data on your behalf that will be very difficult to prove didn't
come from you.

The recommendation is to always force the requirement of a PIN. I believe with
a five minute timeout the risk is acceptable and can make lots of fast changes
inside a git repository managable. The pin will be required again regardless of
time if the card is removed and readded.

NOTE: There seems to be a better option. Using the `yubikey-manager` package in
Fedora (present in at least Fedora 29) we can enforce the requirement of
touching the pad whenever one of the keys is used. Enter pin once for the
timeout windows then touch for every action. This has the benefit of being a
much easier workflow while preventing an attacker from using the key without a
physical presence. This can be done with the following commands:

```console
ykman openpgp touch sig on
ykman openpgp touch aut on
ykman openpgp touch enc on
```

The above requires having a YubiKey 4 or later.

Exit out and open up the gpg --edit-key view again. We need to add the subkeys.
First we need to switch to the private key view:

```console
> toggle
```

For the three keys (numbered 1-3) you want to transfer them using the following
commands:

```console
> key 1
> keytocard
> key 1
```

This selects the keys individually, copies them, then deselects them. It needs
to be done for each of them. End this with a 'save' command and you should be
left with just stubs of the keys in the secret keyring.

On new machines that need to have the stubs added we can perform the following
status:

```console
gpg --card-edit
> fetch
> quit
```

You should be able to view the stubs and their presence on the card with:

```console
gpg -K
gpg --card-status
```

Should be able to test that the card is working by encrypting a message and
then decrypting it with smartcard.

```console
cat << EOF > message.txt
Just a secret test message...
EOF

gpg -esar sstelfox@bedroomprogrammers.net message.txt
```

It should ask you for your pin before continuing. Decrypting can be done using
the following:

```console
gpg -d message.txt.asc
```

That confirms that the signing key & encryption key are both working. The
authentication key is for using the GPG agent as an SSH agent. To test this one
we need to run the gpg-agent with it's SSH compatibility layer like so:

```console
gpg-agent --enable-ssh-support
source ~/.gpg-agent-info
```

Test to make sure a card is showing up:

```console
ssh-add -l
```

To get it in an appropriate format for authorized_keys file:

```
ssh-add -L
```

For use on other linux systems the scdaemon binary is required which may be in
a different package...

* Additional notes: https://wiki.fsfe.org/TechDocs/CardHowtos/CardWithSubkeysUsingBackups

We need to check the GPG configuration (gpg.conf) against that link as we may
need to sign and encrypt with an additional alternate key (hidden-encrypt-to
and default-recipient entries).

On gentoo I needed to change the default use flags for app-crypt/gnupg with the
following:

```
# /etc/portage/package.use/gnupg

app-crypt/gnupg smartcard usb
```

## Final Tasks

Get the key ID of the primary key from `gpg -k` and push it to the common
public key server:

```
gpg --send-keys 0xBEBEF280BCE92620
```

Also export the file for uploading to my website:

```
gpg --armor --export 0xBEBEF280BCE92620 > publickey.gpg
```

The only time the master key should be required to come out to play:

* You need your main key (e.g. to sign another PGP key)
* You have to replace your card and want to reuse the subkeys
* Revoking subkeys that have been compromised
* Your card was lost or stolen and you need to revoke the subkeys

TAILS should be booted backup, if a new key needs to get signed it needs to be
imported from a file. Then signed with `gpg --sign-key <Key ID>`.

## Key Signing Party

Get a fingerprint summary file and print out copies for people present using
the following command:

```
gpg --fingerprint sstelfox@bedroomprogrammers.net > key_for_partying.txt
```

Pull keys by their IDs (0x12345678 for the example), compare the contents of
the key to what you expect, sign the key, push it to the keyserver, and email
the owner a copy of their signature.

```
gpg --recv-keys 0x12345678
gpg --list-keys 0x12345678
gpg --sign-key 0x12345678

gpg --send-keys --keyserver keyserver.ubuntu.com 0x12345678
gpg --send-keys --keyserver hkps.pool.sks-keyservers.net 0x12345678

gpg --armor --export 0x12345678 --output 0x12345678.signed-by.your-id.asc
```

Email the 0x12345678.signed-by.your-id.asc file to one of the emails listed in
the key. When someone sends you a signature just import it like so:

```
gpg --import your-id.signed-by.0x12345678.asc
```

You can see your signatures with:

```
gpg --list-sigs <your-id>
```

More note URLs:

* https://help.ubuntu.com/community/GnuPrivacyGuardHowto

## Git Notes

Git needs to be configured with which key to use for signatures. First you need
to find your key ID, this can be done using the following command:

```
gpg --list-secret-keys
```

The key ID will look something like: `8EE30EAB`. Configure the global signing
key using the following command, replacing the sample key ID with yours:

```
git config --global user.signingkey 8EE30EAB
```

Ensure that they are doing this automatically:

```
git config --global commit.gpgsign true
```

This will ask you for your pin or password on your GPG key everytime you commit
which can be remedied by using a GPG agent. This will reduce your security
generally though.

## Key Transitions

For key transitions where your key hasn't been compromised, a transition
statement needs to be published by both the old and new key. I have a [sample
transition statement][1] that can be filled in with your respective
information. Variables in message are embedded with {var} commands are {{cmd}}.

The variables in the template are firstName, fullName, email, oldKeyId,
newKeyId, pubKeyUrl, and pubStmntUrl. The pubKeyUrl and pubStmntUrl variables
should be valid paths to files on an HTTPS protected webserver.

Once you've filled out the transition statement you need to ensure both keys
are cross signed and the signatures are published.

```
gpg --local-user $oldKeyId --sign-key $newKeyId
gpg --local-user $newKeyId --sign-key $oldKeyId
gpg --send-keys $oldKeyId $newKeyId
```

The file itself still needs to be signed by both keys which can be done with
the following command:

```
gpg --local-user $oldKeyId --local-user $newKeyId --clearsign $keyTransitionFile
```

If both keys don't exist on the same machine you'll need to refer to the
section titled 'Multiple Clearsigned Signatures' for how to handle the
situation.

I recommend you publish the key transition with a name that includes the date,
like `key-transition-2017-08-17.txt`.

## Expiration / Renewal of Subkeys

TODO: I need to cover certificate key transitions and signed key transition
statements.

### Option 1: Generate a new signing / encryption key

Pros:

* Most secure
* Some level of forward secrecy (over large time scales)
* Helps protect against unknown key compromises

Cons:

* Only one keypair stored per smartcard (decrypting old files means restoring a
  backup of the old key)
* More complicated
* Requires users to refresh their keys about you

Steps:

1. Generate new keys
2. Generate CRLs for old keys
3. Load keys on to smartcard
4. Push new keys and CRLs to keyservers

### Option 2: Extend Expiration

Pros:

* Simple
* Fast

```
gpg --edit-key 0x12345678
gpg> key 1
gpg> expire
...
gpg> key 1
gpg> key 2
gpg> expire
...
gpg> save

gpg --send-keys 0x12345678
```

## Maintenance

To ensure we get updated keys and revocation announcements the keys in your
keyring should be periodically refreshed with the public key server. This can
be done all at once using the following command:

```
gpg2 --refresh-keys
```

Likewise after modifying your own key it should be pushed to the public key
servers for consumption and availability of others.

```
PRIMARY_KEY_EMAIL=sstelfox@bedroomprogrammers.net
gpg2 --send-key $(gpg2 -k $PRIMARY_EMAIL | grep pub | awk '{ print $2 }' | cut -d '/' -f 2)
```

There is a social network disclosure that occurs when all keys are refreshed at
once. The description of this disclosure is:

> We assume there probably exists at least one subset of public keys in this
> keyring that identifies it, i.e. no other individual's keyring contain the
> same subset of public keys.

A personal thought potentially making this attack easier, it is very likely
that one of the keys being refreshed is owner of the keyring itself.

Trusted SSL communications (hkps) eliminates this threat for passive snoopers,
the analysis could still be done on the keyserver itself.

To avoid this individual keys would have to be refreshed independently over
time. The requests could still be tied to the keyring machine's IP address to
correlate all the refreshed keys to build back up the contents of the keyring.
Avoiding this would require use of individual Tor circuits to mask and
distribute key refreshes.

A project has been built up to handle this issue. The following are relevant:

* https://code.openhub.net/file?fid=BbMaEKchr9cDAOVs8ozX5mJ40g8&cid=RfbvTf3fwdw&fp=405976&mp&projSelected=true#L0
* https://github.com/EtiennePerot/parcimonie.sh/blob/master/parcimonie.sh

## Diagnostics

### No Usuable Subkey

One one of my devices I was persistently getting an odd error message whenever
I tried to sign something. The error message was:

```
$ gpg2 -esar sam@stelfox.net sample-file
gpg: no default secret key: Unusable secret key
gpg: tor-setup-script.sh: sign+encrypt failed: Unusable secret key
```

Turns out I hadn't updated my public keys on that device and `gpg2 --card-edit`
followed by a `fetch` didn't actually update my certificate. I needed to
refresh the key from the key server to get my new signatures and public key and
retrust it.

```
gpg2 --refresh-keys 0x30856D4EA0FFBA8F
gpg2 --edit-key 0x30856D4EA0FFBA8F
trust
```

### Card Not Visible to User (May be seen by root)

I installed `pcsc-tools` to get `pcsc_scan` but I don't believe that
contributed to the fix. Ultimately I needed to start up the `pcscd` service and
replug my yubikey.

### Unable to connect to dirmngr (IPC connect call failed)

While trying to refresh keys I was getting the following error:

```
gpg: connecting dirmngr at '/run/user/1000/gnupg/S.dirmngr' failed: IPC connect call failed
```

I rebooted the machine, and that didn't solve it. Ultimately I believe it was
permissions / ownership issues on the `~/.gnupg/crls.d` directory but I can't
be entirely sure.

I solved this issue by deleting everything in my `.gnupg` directory and
checking out the version from my dotfiles again.

## Remote Usage of Smartcard

Basically relies on the extra-socket option for gpg-agent. May be able to
accomplish this with something like the following command (path may be
incorrect):

```
ssh -R /run/user/1000/gnupg/S.gpg-agent:/home/sstelfox/.gnupg/S.gpg-agent.remote  -o "StreamLocalBindUnlink=yes" remote-host
```

This could also live in an `ssh/config` parameter like so:

```
Host remote
  RemoteForward /run/user/1000/gnupg/S.gpg-agent:/home/sstelfox/.gnupg/S.gpg-agent.remote
  StreamLocalBindUnlink yes
```

The following command should work but will warn about the agent being in
restricted mode.

```
gpg-connect-agent /bye
```

## Multiple Clearsigned Signatures

If multiple keys on different machines need to perform a clearsign on a
document the normal method doesn't support combining these signatures to be
verified in one pass. This is valuable for allowing multiple independent people
to attest to the validity of a document and make it easy for people to validate
the correctness of it.

### Notes

If the private keys are on the same machine the `--local-user` flag can simply
be specified multiple times. This is likely the most applicable for
key-transition statements.

```
gpg2 --local-user pers1 --local-user pers2 --clearsign content
```

ONLY PARTIALLY IDEAL: Detached signatures can be combined in the same way and
don't require a lot of the sed magic used here. A detached signature can be
generated with:

```
gpg2 --armor --detach-sign content
```

If this is done only the dearmor, split, combine, enarmor steps need to be
performed.

### Process

First we need content to sign:

```
echo 'A very important statement about a very important topic.' > content
```

Each signatory should receive or generate a copy of the content and verify it.
This transport is beyond the scope of this document but could easily be done
with a standard `gpg2 -esa -r pers1 -r pers2 content` and emailed then
decrypted.

Once each user has a copy and verified it. They need to perform a normal
clearsign on the content and send the signed message back to an individual to
perform the combinatory process.

```
gpg2 --clearsign content
```

This assumes you now have the signed contents file from pers1 and pers2 in the
files `content.pers1.asc` and `content.pers2.asc`. Verify both signatures are
valid:

```
gpg2 --verify content.pers1.asc
gpg2 --verify content.pers2.asc
```

We need to verify the content is still identical in both files (one of them
could have changed the content before signing to be tricky). This is kind of a
formality since the signature won't check out for at least one of them if the
content differs between the two in any way.

```
sed -n '1,/SIGNATURE/ p' content.pers1.asc | sha1sum
sed -n '1,/SIGNATURE/ p' content.pers2.asc | sha1sum
```

We then need to extract just the signature blocks from each message and turn
them into the raw gpg2 packets:

```
sed -n '/SIGNATURE/,$ p' content.pers1.asc | gpg2 --dearmor | gpgsplit --no-split > pers1.sig
sed -n '/SIGNATURE/,$ p' content.pers2.asc | gpg2 --dearmor | gpgsplit --no-split > pers2.sig
```

We then combine them into one enarmored signature (order doesn't matter):

```
cat pers1.sig pers2.sig | gpg2 --enarmor | sed -n '5,$ p' | grep -v -- ----- > combo.sig
```

And append the signatures back onto the content:

```
(sed -n '1,/SIGNATURE/ p' content.pers1.asc; echo; cat combo.sig; \
  echo '-----END PGP SIGNATURE-----') > content.combo.asc
```

Verify the signatures are still good:

```
gpg2 --verify content.combo.asc
```

[1]: /note_files/gnupg/key_transition_template.txt
