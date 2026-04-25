---
date: 2017-10-09 23:35:34+00:00
updated_at: 2026-04-05T00:00:00-0000
tags:
- gpg
- linux
- security
title: GPG Process Notes
slug: gpg-process-notes
aliases:
  - /notes/gpg-process-notes/
quiz:
  - question: "When creating a master key with custom capabilities, which single capability should it retain?"
    type: multiple-choice
    options:
      - "Sign"
      - "Encrypt"
      - "Certify"
      - "Authenticate"
    answer: 2
  - question: "The `keytocard` command copies key material to the smartcard while keeping the original in your local keyring."
    type: true-false
    answer: false
  - question: "Which of the following are valid reasons to prefer WKD over traditional keyservers for key distribution?"
    type: multi-select
    options:
      - "You control the key distribution infrastructure yourself"
      - "It provides built-in domain validation since only the domain operator can place keys"
      - "It eliminates the need to publish keys to any keyserver"
      - "It avoids leaking your social graph through centralized lookup patterns"
    answer: [0, 1, 3]
  - question: "Refreshing all keys in your keyring at once from a keyserver is safe because HKPS encrypts the transport."
    type: true-false
    answer: false
  - question: "Which of the following are advantages of generating new subkeys at renewal time instead of extending expiration on existing ones?"
    type: multi-select
    options:
      - "Provides forward secrecy over long time scales"
      - "No disruption to existing workflows"
      - "Protects against unknown key compromises"
      - "Avoids requiring contacts to refresh their copy of your key"
    answer: [0, 2]
---

These are my working notes on GnuPG key management, smartcard workflows, and
related operational practices. This covers everything from initial key creation
through daily use, maintenance, and diagnostics.

## Initial Key Creation

Start with a clean GnuPG directory. Modern GnuPG uses the keybox format
internally so there's no need to worry about legacy keyring files.

```bash
rm -rf ~/.gnupg/*
```

Drop in your preferred `gpg.conf` from your dotfiles, then begin key
generation:

```bash
gpg --expert --full-generate-key
```

Choose option `8` (RSA with custom capabilities). Disable all capabilities
except **Certify**, then press `q` to continue. Use a 4096 bit key size. Set
the expiration to 2 years. You can always extend expiration later by re-signing
the certificate with a later date.

Set your name, email (`sam@stelfox.net`), and a strong passphrase. Let it
generate.

Once the master key exists, we need subkeys. Edit the key:

```bash
gpg --expert --edit-key sam@stelfox.net
```

Add any additional UIDs you need:

```text
gpg> adduid
gpg> uid 1
gpg> primary
```

Now generate subkeys. Run `addkey` three times to create separate subkeys for
signing, encryption, and authentication:

```text
gpg> addkey
```

For each subkey, choose option `8` (RSA custom capabilities) and enable only
the single capability you want (Sign, Encrypt, or Authenticate respectively).
Use 2048 bits if you plan to use a smartcard that only supports that size,
otherwise 3072 or 4096 is better. Set expiration to 6 months for subkeys.

You'll need the master key passphrase for each subkey creation.

Optionally attach a photo ID. Crop and scale an image to 240x288 max (smaller
is better, must be under 4KB). Strip metadata with `jpegoptim -s` before
adding:

```text
gpg> addphoto
```

Save everything:

```text
gpg> save
```

## Backup Procedures

Before doing anything else, create comprehensive backups of the key material.

```bash
mkdir ~/gpg_backups

gpg -a --export-secret-key sam@stelfox.net > ~/gpg_backups/secret_key.gpg
gpg -a --export sam@stelfox.net > ~/gpg_backups/publickey.gpg
gpg -a --gen-revoke sam@stelfox.net > ~/gpg_backups/revocation_cert.gpg
```

For the revocation certificate, choose "Key has been compromised" with an empty
description. This is the worst-case scenario cert and should be stored
somewhere extremely safe.

Create a `paperkey` backup of the secret key material:

```bash
gpg --export-secret-key sam@stelfox.net | paperkey > ~/gpg_backups/paperkey.bak
```

Print `paperkey.bak` on acid-free paper and store it in a secure location. If
the worst happens and you need to recover from the paper backup, you'll need to
type it back into a text file and then reconstruct the key:

```bash
paperkey --pubring ~/gpg_backups/publickey.gpg \
  --secrets ~/gpg_backups/paperkey.bak --output ~/recovered_secret.gpg
```

Store all backup files on encrypted offline media (USB drive, etc.) in a
physically secure location.

## Subkey-Only Workflow

For daily use, you should not have the master secret key on your working
machines. The master key only comes out for certifying other keys, revoking
subkeys, or modifying UIDs.

Export just the subkeys:

```bash
gpg -a --export-secret-subkeys sam@stelfox.net > ~/gpg_backups/subkey_secrets.gpg
```

Delete all secret keys from the working keyring:

```bash
gpg --delete-secret-keys sam@stelfox.net
```

Confirm the deletion (double confirmation required). Now reimport only the
subkeys:

```bash
gpg --import ~/gpg_backups/subkey_secrets.gpg
```

Verify that only subkeys are present in the secret keyring. The master key
should show `sec#` (the `#` means the secret key is missing):

```bash
gpg -K
```

Export the subkey-only keyring for transfer to other machines:

```bash
gpg -a --export-secret-keys sam@stelfox.net > ~/gpg_backups/laptop_keys_secret.gpg
gpg -a --export sam@stelfox.net > ~/gpg_backups/laptop_keys_public.gpg
```

On a new machine, import both files:

```bash
gpg --import laptop_keys_public.gpg
gpg --import laptop_keys_secret.gpg
```

If you're using a smartcard, you don't need the laptop keyring files at all as
long as the public key is available (via a URL set on the card or from a
keyserver).

## Smartcard Usage

The secret subkeys are best stored on a hardware token. OpenPGP smartcards
(like the OpenPGP Smartcard V2 with a Gemalto USB Shell Token V2) and
[YubiKeys](yubikey) both work well. This assumes `pcscd` and `libccid` are
installed on your system.

### PIN Management

OpenPGP smartcards ship with factory default PINs:

- **User PIN**: `123456`
- **Admin PIN**: `12345678`

These must be changed immediately. Three incorrect user PIN attempts locks the
card until the admin PIN is provided. Three incorrect admin PIN attempts
permanently destroys the card.

Change the PINs:

```text
gpg --card-edit
gpg/card> admin
gpg/card> passwd
```

Change the user PIN (option 1) then the admin PIN (option 3).

While you're in card-edit, set some useful metadata:

```text
gpg/card> url
```

Set this to the URL where your public key can be downloaded (e.g.
`https://stelfox.net/publickey.gpg`). Also set your name and language:

```text
gpg/card> name
gpg/card> lang
```

### Signature PIN Policy

The "Signature PIN" setting controls whether the PIN is required for every
signature or can be cached. Setting it to "forced" is more secure but makes
workflows like rapid git commits painful. Setting it to "not forced" allows
the gpg-agent to cache the PIN for a timeout window.

The recommendation is to always force the PIN requirement. With a reasonable
timeout configured in the agent, the friction is manageable. The PIN is always
required again if the card is removed and reinserted.

### YubiKey Touch Policy

A better option for [YubiKeys](yubikey) (version 4 and later) is to require a
physical touch for each cryptographic operation. This way you enter your PIN
once for the cache window, but an attacker who has access to your session still
can't use the key without physical presence at the device.

```bash
ykman openpgp keys set-touch sig on
ykman openpgp keys set-touch aut on
ykman openpgp keys set-touch enc on
```

This gives you the convenience of PIN caching with the security guarantee that
every operation requires physical confirmation.

## Moving Keys to Smartcard

With the card configured, transfer the subkeys onto it. Edit your key:

```bash
gpg --edit-key sam@stelfox.net
```

For each of the three subkeys (numbered 1-3), select, transfer, and deselect:

```text
gpg> key 1
gpg> keytocard
gpg> key 1
gpg> key 2
gpg> keytocard
gpg> key 2
gpg> key 3
gpg> keytocard
gpg> key 3
gpg> save
```

When prompted, choose the appropriate slot for each key (signature, encryption,
or authentication). After saving, the secret keyring will only contain stubs
that point to the card.

**Important**: `keytocard` is a destructive move operation, not a copy. The key
material is removed from your local keyring and placed on the card. Make sure
your backups are solid before doing this.

## Setting Up New Machines

On a new machine where you need to use the smartcard, insert the card and run:

```text
gpg --card-edit
gpg/card> fetch
gpg/card> quit
```

The `fetch` command downloads your public key from the URL stored on the card
and creates the local stubs. Verify everything looks correct:

```bash
gpg -K
gpg --card-status
```

You should see your subkeys listed with `ssb>` indicating they live on the
card.

## Testing Encryption, Decryption, and Signing

Verify the card is working end-to-end:

```bash
echo "Just a secret test message..." > message.txt
gpg -esar sam@stelfox.net message.txt
```

This should prompt for your PIN. Decrypt it back:

```bash
gpg -d message.txt.asc
```

That confirms both signing and encryption are functional. The authentication
key gets tested through the SSH agent (next section).

## GPG Agent as SSH Agent

Modern GnuPG can use the authentication subkey on your smartcard as an SSH key.
The gpg-agent handles this through its built-in SSH support.

Add the following to `~/.gnupg/gpg-agent.conf`:

```ini
enable-ssh-support
default-cache-ttl 600
max-cache-ttl 7200
```

Modern GnuPG uses well-known socket paths under `$XDG_RUNTIME_DIR/gnupg/` or
`~/.gnupg/` automatically. There's no need to mess with `GPG_AGENT_INFO` or
source any agent info files. Just make sure `SSH_AUTH_SOCK` points to the
gpg-agent SSH socket. Add this to your shell profile:

```bash
export SSH_AUTH_SOCK=$(gpgconf --list-dirs agent-ssh-socket)
gpgconf --launch gpg-agent
```

Restart your agent or open a new shell, then verify the card's authentication
key shows up:

```bash
ssh-add -l
```

To get the public key in a format suitable for `authorized_keys`:

```bash
ssh-add -L
```

Note: The `scdaemon` binary is required for smartcard support and may live in a
separate package on some distributions (e.g. `gnupg-scdaemon` or similar).

## Publishing Your Key

Get the key ID of your primary key from `gpg -k` and push it to the keyserver:

```bash
gpg --keyserver keys.openpgp.org --send-keys 0xYOURKEYID
```

Also export for hosting on your website:

```bash
gpg --armor --export 0xYOURKEYID > publickey.gpg
```

Note that `keys.openpgp.org` requires email verification before UIDs with email
addresses become discoverable. After uploading, check your email for the
verification link.

## Web Key Directory (WKD)

WKD is a modern key discovery mechanism that lets people find your public key
based on your email address without relying on a centralized keyserver. The key
is hosted directly on the domain in the email address.

When someone runs `gpg --locate-keys sam@stelfox.net`, GnuPG will try to fetch
the key from `https://stelfox.net/.well-known/openpgpkey/` (or the advanced
method using an `openpgpkey` subdomain).

### Setting Up WKD

Export your key in the WKD format. You need the WKD hash of your email's local
part:

```bash
gpg --with-wkd-hash --fingerprint sam@stelfox.net
```

This will show a line like `wks-hash: abc123...@stelfox.net`. Use that hash to
place the key:

```bash
mkdir -p /path/to/webroot/.well-known/openpgpkey/hu/
gpg --no-armor --export sam@stelfox.net \
  > /path/to/webroot/.well-known/openpgpkey/hu/<wkd-hash>
touch /path/to/webroot/.well-known/openpgpkey/policy
```

The `policy` file can be empty but must exist. Your web server needs to serve
this path over HTTPS with the correct content type (`application/octet-stream`).

Alternatively, the `gpg-wks-client` tool can generate the correct structure:

```bash
gpg --list-options show-only-fpr-mbox -k sam@stelfox.net | \
  gpg-wks-client --install-key -C /path/to/webroot/.well-known/openpgpkey/
```

### Why WKD Over Keyservers

WKD has some real advantages. You control the key distribution yourself (no
third-party dependency). There's built-in domain validation since only the
domain operator can place keys there. It works even if keyserver infrastructure
goes down. And it doesn't leak your social graph the way keyserver lookups can.

The downside is it only works for email addresses on domains you control. For
broader distribution, use `keys.openpgp.org` alongside WKD.

## Migrating Keys from Legacy Keyservers

The old SKS keyserver network is effectively dead. If you have keys that were
only published to SKS pool servers, they need to be migrated to
`keys.openpgp.org`.

If you still have the key locally:

```bash
gpg --keyserver keys.openpgp.org --send-keys 0xYOURKEYID
```

Then visit https://keys.openpgp.org and verify your email addresses so the UIDs
become discoverable.

If you're trying to find someone else's key that was only on SKS, you may be
able to find cached copies on `keyserver.ubuntu.com` (which still runs but is
read-only for new uploads in practice). Import it locally and then republish:

```bash
gpg --keyserver keyserver.ubuntu.com --recv-keys 0xTHEIRKEYID
gpg --keyserver keys.openpgp.org --send-keys 0xTHEIRKEYID
```

Note that only the key owner can verify email addresses on `keys.openpgp.org`,
so republishing someone else's key will make the fingerprint searchable but the
email-based UIDs won't be discoverable until they verify themselves.

Update your `gpg.conf` to use the modern keyserver:

```ini
keyserver hkps://keys.openpgp.org
```

Remove any references to `hkps.pool.sks-keyservers.net` or other defunct pools.

## Key Signing Party

Generate a fingerprint summary to print and distribute to participants:

```bash
gpg --fingerprint sam@stelfox.net > key_for_partying.txt
```

After the event, pull each participant's key by ID, verify it matches what they
presented in person, sign it, and publish the signature:

```bash
gpg --keyserver keys.openpgp.org --recv-keys 0x12345678
gpg --list-keys 0x12345678
gpg --sign-key 0x12345678

gpg --keyserver keys.openpgp.org --send-keys 0x12345678

gpg --armor --export 0x12345678 --output 0x12345678.signed-by.your-id.asc
```

Email the `.asc` file to one of the email addresses listed in their key.

When someone sends you their signature of your key:

```bash
gpg --import your-id.signed-by.0x12345678.asc
```

View your collected signatures:

```bash
gpg --list-sigs sam@stelfox.net
```

After importing new signatures, push your updated key so others can see the
web of trust:

```bash
gpg --keyserver keys.openpgp.org --send-keys 0xYOURKEYID
```

## Git Integration

Find your signing key ID:

```bash
gpg --list-secret-keys --keyid-format long
```

Configure git to use it:

```bash
git config --global user.signingkey 0xYOURKEYID
git config --global commit.gpgsign true
```

With `commit.gpgsign` set to `true`, every commit will be signed automatically.
If you're using a smartcard, this will prompt for your PIN (or just require a
touch if you have the YubiKey touch policy configured).

For repositories hosted on platforms like GitHub, you'll also want to upload
your public key to your account settings so signed commits show as "Verified".

## Key Transitions

When transitioning from an old key to a new one (where the old key has not been
compromised), you should publish a signed transition statement so people who
trust your old key can verify you're the same person behind the new one.

The transition statement should include:

- Your name and primary email
- The old key ID and fingerprint
- The new key ID and fingerprint
- URLs where your new public key and the transition statement itself are hosted
- A clear explanation of why you're transitioning
- Instructions for others to verify and update their keyrings

Cross-sign both keys so the trust relationship is bidirectional:

```bash
gpg --local-user $OLD_KEY_ID --sign-key $NEW_KEY_ID
gpg --local-user $NEW_KEY_ID --sign-key $OLD_KEY_ID
gpg --keyserver keys.openpgp.org --send-keys $OLD_KEY_ID $NEW_KEY_ID
```

Sign the transition statement with both keys:

```bash
gpg --local-user $OLD_KEY_ID --local-user $NEW_KEY_ID --clearsign key-transition.txt
```

If the two keys don't exist on the same machine, refer to the "Multiple
Clearsigned Signatures" section below for the process.

Publish the signed transition statement at a stable URL. Name it with the date,
like `key-transition-2026-04-05.txt`, and send it to people who have signed
your old key.

## Subkey Expiration and Renewal

When subkeys approach expiration, you have two options.

### Option 1: Generate New Subkeys

**Pros:**

- Most secure approach
- Provides some forward secrecy over long time scales
- Protects against unknown key compromises

**Cons:**

- Only one set of subkeys per smartcard slot (decrypting old messages means
  restoring a backup of the old key)
- More complex process
- Requires contacts to refresh their copy of your key

Steps:

1. Bring the master key out of cold storage
2. Generate new subkeys (same process as initial creation)
3. Optionally revoke the old subkeys
4. Load the new subkeys onto the smartcard
5. Publish the updated key to `keys.openpgp.org` and your WKD

### Option 2: Extend Expiration

**Pros:**

- Simple and fast
- No disruption to existing workflows

**Cons:**

- No forward secrecy benefit
- Doesn't protect against unknown compromises

Bring out the master key and extend each subkey:

```text
gpg --edit-key 0xYOURKEYID
gpg> key 1
gpg> expire
...
gpg> key 1
gpg> key 2
gpg> expire
...
gpg> key 2
gpg> key 3
gpg> expire
...
gpg> save
```

Then publish the updated key:

```bash
gpg --keyserver keys.openpgp.org --send-keys 0xYOURKEYID
```

Remember to deselect each key (by toggling it again) before selecting the next
one.

## Maintenance

Periodically refresh the keys in your keyring to pick up updated expiration
dates, new subkeys, and revocation announcements:

```bash
gpg --refresh-keys
```

After modifying your own key, push the updates:

```bash
gpg --keyserver keys.openpgp.org --send-keys 0xYOURKEYID
```

If you also have WKD set up, remember to update the key file there as well.

## Privacy Considerations

Refreshing all keys in your keyring at once leaks information about your social
graph. Even over HKPS (encrypted transport), the keyserver itself can observe
which keys you're requesting and correlate them into a likely unique keyring
fingerprint.

The general idea: if you refresh all keys at once, the specific combination of
keys in your keyring probably identifies you. And since one of those keys is
almost certainly your own, the keyserver can tie the whole set to your
identity.

To mitigate this, keys can be refreshed individually over time through separate
connections. For stronger protection, each refresh can go through an
independent Tor circuit. The `parcimonie` project was built to automate
exactly this: https://github.com/EtiennePerot/parcimonie.sh

Using WKD where possible also helps since key lookups go directly to the key
owner's domain rather than a centralized server.

## Diagnostics

### Unusable Subkey

If you get an error like:

```text
$ gpg -esar sam@stelfox.net sample-file
gpg: no default secret key: Unusable secret key
gpg: sample-file: sign+encrypt failed: Unusable secret key
```

This usually means your local copy of the public key is stale. The card stubs
reference subkeys that your public key doesn't know about (maybe you renewed
subkeys and didn't update this machine).

Running `gpg --card-edit` and `fetch` might not be enough if the issue is with
signatures or expiration on the public key. Refresh from the keyserver:

```text
gpg --keyserver keys.openpgp.org --refresh-keys 0xYOURKEYID
gpg --edit-key 0xYOURKEYID
gpg> trust
```

Set the trust level appropriately (ultimate for your own key) and save.

### Card Not Visible to User

If the smartcard is visible to root but not your user account, the `pcscd`
service probably isn't running or has permissions issues. Start the service and
replug the device:

```bash
sudo systemctl start pcscd
sudo systemctl enable pcscd
```

Then remove and reinsert your smartcard or [YubiKey](yubikey). The `pcsc-tools`
package provides `pcsc_scan` which is useful for debugging card detection.

### Unable to Connect to dirmngr

If you see:

```text
gpg: connecting dirmngr at '/run/user/1000/gnupg/S.dirmngr' failed: IPC connect call failed
```

This is usually a permissions or ownership issue on the GnuPG directory. Try
restarting the agent components:

```bash
gpgconf --kill all
gpgconf --launch gpg-agent
```

If that doesn't help, check ownership on `~/.gnupg` and everything inside it.
As a last resort, back up your `gpg.conf`, wipe `~/.gnupg`, restore the
config, and re-fetch your keys.

## Remote Usage of Smartcard via SSH Forwarding

You can forward your local gpg-agent socket to a remote machine over SSH,
allowing you to use your local smartcard for GPG operations on the remote host.

This relies on the gpg-agent extra socket. Make sure it's enabled in
`~/.gnupg/gpg-agent.conf`:

```ini
extra-socket /run/user/1000/gnupg/S.gpg-agent.extra
```

(On most modern systems this is enabled by default.)

Forward the socket when connecting:

```bash
ssh -R /run/user/1000/gnupg/S.gpg-agent:/run/user/1000/gnupg/S.gpg-agent.extra \
  -o "StreamLocalBindUnlink=yes" remote-host
```

Or configure it in `~/.ssh/config`:

```sshconfig
Host remote
  RemoteForward /run/user/1000/gnupg/S.gpg-agent /run/user/1000/gnupg/S.gpg-agent.extra
  StreamLocalBindUnlink yes
```

On the remote host, verify the agent is reachable:

```bash
gpg-connect-agent /bye
```

This may warn about the agent being in restricted mode, which is normal for
forwarded sockets. The remote machine will need your public key available
locally (import it or set up the card URL) but all private key operations will
be forwarded back to your local smartcard.

Note: The remote user ID (and thus the `/run/user/XXXX/` path) needs to match
on both sides, or you'll need to adjust the paths accordingly.

## Multiple Clearsigned Signatures

Sometimes multiple parties need to clearsign the same document, like a key
transition statement that needs to be signed by both the old and new key on
different machines.

### Same Machine (Simple Case)

If both private keys are available on the same machine, just specify
`--local-user` multiple times:

```bash
gpg --local-user pers1 --local-user pers2 --clearsign content
```

This is the typical case for key transition statements where you have both keys
accessible.

### Different Machines (Manual Combination)

When the keys are on separate machines, each party signs independently and then
the signatures are combined.

Create the content to sign:

```bash
echo 'A very important statement about a very important topic.' > content
```

Each signatory receives a copy of the content (transport it securely, e.g.
encrypted with `gpg -esa -r pers1 -r pers2 content`), verifies it, and
produces a clearsigned version:

```bash
gpg --clearsign content
```

Collect the signed files (e.g. `content.pers1.asc` and `content.pers2.asc`).
Verify both:

```bash
gpg --verify content.pers1.asc
gpg --verify content.pers2.asc
```

Confirm the content is identical in both signed messages:

```bash
sed -n '1,/SIGNATURE/ p' content.pers1.asc | sha1sum
sed -n '1,/SIGNATURE/ p' content.pers2.asc | sha1sum
```

Extract the raw signature packets from each:

```bash
sed -n '/SIGNATURE/,$ p' content.pers1.asc | gpg --dearmor | gpgsplit --no-split > pers1.sig
sed -n '/SIGNATURE/,$ p' content.pers2.asc | gpg --dearmor | gpgsplit --no-split > pers2.sig
```

Combine them into one armored signature block:

```bash
cat pers1.sig pers2.sig | gpg --enarmor | sed -n '5,$ p' | grep -v -- ----- > combo.sig
```

Reassemble the signed document:

```bash
(sed -n '1,/SIGNATURE/ p' content.pers1.asc; echo; cat combo.sig; \
  echo '-----END PGP SIGNATURE-----') > content.combo.asc
```

Verify the combined signatures:

```bash
gpg --verify content.combo.asc
```

### Detached Signatures (Alternative)

Detached signatures can also be combined and don't require the sed manipulation
of the clearsigned format:

```bash
gpg --armor --detach-sign content
```

Only the dearmor, split, combine, and enarmor steps are needed for detached
signatures.
