---
created_at: 2013-11-25T15:10:46-0500
evergreen: false
public: true
tags:
  - linux
  - security
title: Using VIM as Your Password Manager
slug: using-vim-as-your-password-manager
---

# Using VIM as Your Password Manager

There are all kinds of password managers out there. Everything from web services that are quite solid and respectable, to [native](https://lastpass.com/) [desktop](http://keepass.info/) apps.

A lot of these are simply too heavy for me, involve installing software on a computer to access in addition to sharing the file around, or required you to remember multiple account details before you could get access to any individual password.

Due too the various complexities and lack of matching use cases a couple years ago I set out to develop my own open-source version of PassPack. In the interim though I needed a solution for keeping track of my hundreds of various accounts and their passwords.

Around this time I was ramping up my usage of vim and happened to come across a very fortunate command entirely by accident. Enter *vimcrypt*.

For any plaintext file you, while in command mode you can type the command `:X` and it will ask you for a password to encrypt your file with. By default this uses a remarkably weak algorithm called [pkzip](https://en.wikipedia.org/wiki/PKZIP) which isn't secure enough for me to trust it with my keys.

Since vim 7.3 and later, `:X` has also supported an additional cipher; The much stronger blowfish algorithm. You can enable this by running the command `:set cryptmethod=blowfish`. I chose to add the following lines to my `~/.vimrc` file:

```vimrc
" When encrypting any file, use the much stronger blowfish algorithm
set cryptmethod=blowfish
```

This was a fantastic interim solution as I have yet to find a development or production Linux system that hasn't been excessively locked down (and probably not somewhere I'd put my password file anyway) that didn't already have vim installed.

Using this personally required me coming up with a pseudo-file format that would allow me to quickly and easily find the credentials I needed. I settled on the simple format shown off below:

```text
Oneline Account Description
  Site: <URL of Site's login page>
  Username: <username for the site>
  Password: <password for the site>
  Email: <email I used to register>

  Login with: <email|username> # Only necessary when I have both

  ** Address on file **
  ** Phone on file **
```

You'll notice I also used this to keep track of whether an account had physical information tied to it. When I moved this made it very quick for me to search for accounts that I needed to update with my new mailing address.

As with many solutions this "temporary" one became more and more permanent as my motivation to build the Passpack competitor dwindled. My problem had been solved and I was no longer compelled to put any effort into a solution.

If this still isn't strong enough for your tastes, the [vim wiki](http://vim.wikia.com/wiki/Encryption) has some additional ways you can encrypt your files. These all require additional setup and failed my requirements in that they generally require additional files or setup before I can access my passwords.

Hope this helps some other weary CLI warrior some trouble. Cheers!

***Update***: I received a recommendation from a user named [sigzero](http://www.reddit.com/r/vim/comments/1rg3ji/wrote_up_my_thoughts_on_using_vim_as_a_password/cdn20o8) over on Reddit. For additional security they added the following line to their "~/.vimrc" file.

```vimrc
autocmd BufReadPost * if &key != "" | set noswapfile nowritebackup viminfo= nobackup noshelltemp history=0 secure | endif
```

It disables additional files that vim may write copies to such as swap files and backups, prevents dangerous shell commands, and prevents vim from storing a history of commands.

***Update 2***: I received another recommendation from another Reddit user, this time from [NinlyOne](http://www.reddit.com/r/vim/comments/1rg3ji/wrote_up_my_thoughts_on_using_vim_as_a_password/cdnn94z). At their recommendation, I've prepended the following mode line to my password.  It automatically folds each password entry to prevent potential shoulder surfing. You can open up an entry using the command `zo` and close it back up with `zc`. It's worth noting that this is tied to my indented file format.

```text
# vim: fdm=indent fdn=1 sw=2:
```
