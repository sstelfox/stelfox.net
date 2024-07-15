---
created_at: 2018-06-14T11:36:09-0600
title: SPF and Google Site Verification in Route 53
tags:
  - aws
  - dns
  - tips
---

Route53 doesn't allow multiple definitions of the same name/type pair of DNS
entries which is quite a headache. This is the first time I've had a conflict
of a TXT record in Route53 at the base, specifically both Google's site
verification, and SPF records both want to live at the root of the domain. The
site verification record needs to stay around as Google periodically
re-verifies the domain.

To get this to work you need to quote both the Google verification string and
the SPF record, but you also have to ensure that there is a newline in the
field. The contents of the entry should look something like this:

```
"google-site-verification=<auth string>"
"v=spf1 include:_spf.google.com ~all"
```

You can use [Google's MX Toolbox][1] to verify the SPF record.

[1]: https://toolbox.googleapps.com/apps/checkmx/check
