---
title: Gitorious
type: note
---

# Gitorious

## Initial Setup

* Create a new shell account
* Created new dreamhost domain "git.example.org" with passenger enabled
* Created new database for the gitorious site, added gitorious mysql user
* Waited for dreamhost to create site
* Added IPv6 address for the domain (optional)

Create a directory for the repositories, and tarballs to live:

```
mkdir ~/.repositories ~/.git-tarballs ~/.git-tarballs-work
```

```
rm -rf git.example.org
git clone git://gitorious.org/gitorious/mainline.git git.example.org
cd git.example.org
git submodule update --init
```

Copy the sample configurations into place...

```
cp config/database.sample.yml config/database.yml
cp config/broker.yml.example config/broker.yml
cp config/gitorious.sample.yml config/gitorious.yml
```

Change `config/database.yml` to be:

```yml
development:
  adapter: sqlite3
  database: db/development.db
  pool: 5
  timeout: 5000
  encoding: utf8
test:
  adapter: sqlite3
  database: db/test.db
  pool: 5
  timeout: 5000
  encoding: utf8
production:
  adapter: mysql
  database: databasename
  username: databaseuser
  password: databasepass
  host: databasehost
  encoding: utf8
```

Make sure to update production with the connection information for your
database.

You'll want to collect a few pieces of information for the next config file:

* Hostname of the server (The example uses git.stelfox.net)
* Server's SSH fingerprint (guide uses
  "7e:af:8d:ec:f0:39:5e:ba:52:16:ce:19:fa:d4:b8:7d" the default), if you've
  SSH'd to it from where you are you can look up it's fingerprint like so:
  * `ssh-keygen -l -F git.example.org`
* Full path to where the repositories will live (following this guide it will
  be `/home/<username>/.repositories`
* Full path for tar ball work directories (following this guide it will be
  `/home/<username>/.git-tarballs` and `/home/<username>/.git-tarballs-work`
* User's email to receive exception notifications (probably your email, this
  guide uses me@example.org)
* What email address you want support requests to arrive at (This guide uses
  support@example.org)

```yml
production:
  gitorious_client_port: 80
  gitorious_client_host: git.example.org
  gitorious_host: git.example.org

  repository_base_path: "/home/<username>/.repositories"
  archive_cache_dir: "/home/<username>/.git-tarballs"
  archive_work_dir: "/home/<username>/.git-tarballs-work"

  cookie_secret: # Generate random 64 character string for this
  use_ssl: false

  gitorious_user: <username>
  exception_notification_emails: me@example.org

  # IMPORTANT: "sync" doesn't require a daemon to run (which is needed on
  # shared hosting)
  messaging_adapter: sync

  disable_record_throttling: false
  merge_request_diff_timeout: 10

  public_mode: true
  enable_private_repositories: true
  only_site_admins_can_create_projects: true

  # System message that will appear on all pages if present
  system_message:

  locale: en

  hide_http_clone_urls: false
  hide_git_clone_urls: false

  # Is this gitorious.org? Read: should we have a very flashy homepage?
  #is_gitorious_dot_org: true

  # Configure which address to use as From when sending email
  sender_email_address: "Gitorious <no-reply@git.example.org>"

  # Mangle visible e-mail addresses (spam protection)
  mangle_email_addresses: true

  # Available project licenses.
  licenses:
    - Academic Free License v3.0
    - MIT License
    - BSD License
    - Ruby License
    - GNU General Public License version 2 (GPLv2)
    - GNU General Public License version 3 (GPLv3)
    - GNU Lesser General Public License (LGPL)
    - GNU Affero General Public License (AGPLv3)
    - Mozilla Public License 1.0 (MPL)
    - Mozilla Public License 1.1 (MPL 1.1)
    - Qt Public License (QPL)
    - Python License
    - zlib/libpng License
    - Apache License
    - Apple Public Source License
    - Perl Artistic License
    - Microsoft Permissive License (Ms-PL)
    - ISC License
    - Lisp Lesser License
    - Boost Software License
    - Public Domain
    - Other Open Source Initiative Approved License
    - Other/Proprietary License
    - Other/Multiple
    - None

  default_license: MIT License

  # Stuff that's in the html <head>. custom stats javascript code etc
  #extra_html_head_data:

  # Email address to the support for the Gitorious server
  gitorious_support_email: support@example.org
  ssh_fingerprint: "7e:af:8d:ec:f0:39:5e:ba:52:16:ce:19:fa:d4:b8:7d"

  additional_footer_links:
    - - My Home Page!
      - http://example.org/

  #terms_of_use: true
  # If you want to provide your own, add app/views/site/tos.html.erb and then
  # provide /about/tos as the URL. 
  #terms_of_service_url: http://en.gitorious.org/tos
  #privacy_policy_url: http://en.gitorious.org/privacy_policy

  site_name: My Git Repositories

  favicon_url: http://example.org/favicon.png
  logo_url: http://example.org/logo.png
```

Make sure you have a `~/.ssh` directory with permissions set to `0700` and add
the authorized keys for your admins (NOTE: THIS WILL GIVE THEM FULL ACCESS TO
YOUR SHELL ACCOUNT)

Add the following to your `~/.bash_profile` and `~/.bashrc` script.

```
export PATH="$HOME/git.example.com/script:$PATH"
export RAILS_ENV="production"
```

```
gem install bundler
bundle install --path vendor/bundlerake db:migrate \
  RAILS_ENV=productionruby1.8 script/create_admin
```

Answer the questions

Login to your new installation

## A Note on SSH Keys

I strongly recommend that you use a separate shell account on Dreamhost for
this setup for the following reason:

Gitorious will add SSH keys to your authorized keys files every time a user
adds an SSH public key. These are added with a forced command and some
meta-data about the user that added it. This has the consequence of forcing an
option on you.

If you use SSH keys to login normally then this will either prevent you from
logging in with that key (triggering the forced command) or alternatively
prevent you from being able to push to git repositories (by logging in
normally, rather than triggering the forced command). When added the keys will
looks like this in the authorized keys file:

```
### START KEY 1 ###
command="gitorious admin",no-port-forwarding,no-X11-forwarding,no-agent-forwarding,no-pty ssh-rsa QXJlbid0IHlvdSBjcmFmdHk/IFRoaW5raW5nIEknZCB1c2UgcmVhbCBkYXRhIHNvbWV3aGVyZSBpbiBoZXJlLiBUZWUtaGVlLCBob3BlIHlvdSBlbmpveSB0aGlzLi4uIExvcmVtIGlwc3VtIGRvbG9yIHNpdCBhbWV0LCBjb25zZWN0ZXR1ciBhZGlwaXNjaW5nIGVsaXQuIFF1aXNxdWUgcG9ydGEgbGVvIGluIHNlbSBkaWN0dW0gdXQgZWdlc3RhcyBmZWxpcyAgICAgICAgdmFyaXVzLiBQcmFlc2VudCB2ZXN0aWJ1bHVtIHRlbGx1cyBlZ2V0IG1hZ25hIHVsdHJpY2VzIGEgcG9ydHRpdG9yIG5pc2kgZWdlc3Rhcy4gTWF1cmlzIGRpY3R1bSBhdWd1ZSBldSBkaWFtIGNvbW1vZG8gZWdldCBjdXJzdXMgbGFjdXMgcHJldGl1bS4gTnVsbGEgZXVpc21vZCB0aW5jaWR1bnQgYW50ZSBzaXQgYW1ldCByaG9uY3VzLiBQZWxsZW50ZXNxdWUgICAgICAgc3VzY2lwaXQgZ3JhdmlkYSBsaWJlcm8sIHF1aXMgb3JuYXJlIGxlY3R1cyBhZGlwaXNjaW5nIHF1aXMuIFBoYXNlbGx1cyBncmF2aWRhIG5pc2kgdmVsIG5pc2wgZGlnbmlzc2ltIGJsYW5kaXQ= SshKey:1-User:1
### END KEY 1 ###
```

## Restarting the Application

Changes to the configuration, CSS, or Javascript require a restart of the
application this can be done by cd'ing into the git site's directory and
running the following commands:

```
rm -f public/javascripts/all.js public/stylesheets/all.css
touch tmp/restart.txt
```

