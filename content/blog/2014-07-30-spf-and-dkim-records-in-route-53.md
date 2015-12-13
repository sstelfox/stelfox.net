---
date: 2014-07-30 10:46:13 -0400
slug: "spf-and-dkim-records-in-route-53"
tags:
- amazon
- dkim
- mail
- spf
title: "SPF & DKIM Records in Route 53"
---

I'm going to do a more detailed post on emailing from Amazon's infrastructure
soon, but in the meantime I wanted to quickly throw out solutions too a couple
of problems I encountered. These are all specific too Amazon's Route 53, and
most are user error (myself).

## SPF Invalid Characters or Format

After generating my SPF record, I jumped into Route 53, created a new record
pasted in my record, attempted to save and received the following message:

> The record set could not be saved because:
> - The Value field contains invalid characters or is in an invalid format.

I was using the SPF record type at a time (see the next section) and assumed
that I had messed up the format of my record in some way. I banged my head
against the wall and through RFCs thoroughly before I found the solution...

Solution: Wrap your SPF records in quotation characters.

## No SPF Record Found / Validation Failure

Since I have my DMARC policy in place (I'll cover this in my email follow up),
I receive daily domain reports from Google whenever something fails validation
about my domain. After switching to Route 53 for DNS the `authresult` component
started showing up as fail for SPF.

Testing around a few online SPF validators indicated that none of them were
able to see my new SPF record, and there had been plenty of time for it too
propagate.

The SPF resource record type (RRTYPE 99) is available in Route 53 even though
[the record type has been deprecated][1]. Not being familiar with this
particular decision, I assumed I should be using it *instead* of the TXT record
I've used for every other domain, and it would be handled correctly or more
intelligently.

Solution: Either switch the SPF record too a TXT record. or my preference
duplicate it into a TXT record so you have both.

## Invalid DKIM record

This one had me scratching my head for a while. This was my first time
deploying DKIM on a domain that I was not running a Bind name server for.
OpenDKIM is nice enough too generate a Bind record for you which works
perfectly. It's output looks like the following:

```
default._domainkey.example.tld.   IN      TXT     ( "v=DKIM1; k=rsa; t=y; s=email; "
          "p=MIHfMA0GCSqGSIb3DQEBAQUAA4HNADCByQKBwQC2Cwpa/+Xhfkzn0QnyQoxRwoJPb+s51dIt9UtFLMlMFuYa/k3GBwZ7UWeyAaQJ3RibSzKV/YwgFuMrzyISrLNSuL2k1bQlQQG8nl23Mu9Mowcb+mV2/3G7roshK6kOLNA0IV2SBl8/0UoNZR/x7c1lzVtVqdj0vW1SsJzgGfbt4LGRvCPyjdg+SLpYtOd/Li4Y1pvHgSRKQRrklpKeJo"
          "nJQ4+lXWqzYtuX9xdNH46ck2HUl56Ob4cy3/gYCJBWrAsCAwEAAQ==" )  ; ----- DKIM key default for example.tld
```

Copying and pasting everything between the parens in the value field and
pasting them into Route 53 works flawlessly. The catch? This won't be treated
as a single record, but three individual responses. None of which are complete
and valid DKIM records.

This happens because Route 53's value field treats newlines as separate
records.

Solution: Turn it into one long string so it isn't covering multiple lines
right? Not quite...

## TXTRDATATooLong

Combining the DKIM key into one string like so:

```
"v=DKIM1; k=rsa; t=y; s=email; p=MIHfMA0GCSqGSIb3DQEBAQUAA4HNADCByQKBwQC2Cwpa/+Xhfkzn0QnyQoxRwoJPb+s51dIt9UtFLMlMFuYa/k3GBwZ7UWeyAaQJ3RibSzKV/YwgFuMrzyISrLNSuL2k1bQlQQG8nl23Mu9Mowcb+mV2/3G7roshK6kOLNA0IV2SBl8/0UoNZR/x7c1lzVtVqdj0vW1SsJzgGfbt4LGRvCPyjdg+SLpYtOd/Li4Y1pvHgSRKQRrklpKeJonJQ4+lXWqzYtuX9xdNH46ck2HUl56Ob4cy3/gYCJBWrAsCAwEAAQ=="
```

And attempting to save results in the following error message:

> Invalid Resource Record: FATAL problem: TXTRDATATooLong encountered at ...<snip>

Now we're left in a tricky spot. After some research the reason behind this is
clear, and makes sense. Though it is another poor usability bug in the way
Amazon's Route 53 behaves. Individual DNS UDP packets are limited too 255
characters for their response.

Too properly deliver records longer than that DNS servers are supposed to break
up the response into chunks. Properly implemented clients combine these chunks
together (with no spaces, newlines or other characters added). What this means
is that the record can be broken up transparently behind the scenes anywhere in
the message and the client will put it back together correctly.

The Route 53 entry form won't handle this for you though, and in hindsight it
looks like Bind might not do it for you though I suspected that was more for
readability of zone files rather than a technical limitation (and I haven't
tested whether Bind is intelligent enough too handle just a long string).

Solution: Take the original output of Bind between the parens and just remove
the newline characters, leave the quotation marks and spaces between the
sections like the following sample and you'll be golden:

```
"v=DKIM1; k=rsa; t=y; s=email; " "p=MIHfMA0GCSqGSIb3DQEBAQUAA4HNADCByQKBwQC2Cwpa/+Xhfkzn0QnyQoxRwoJPb+s51dIt9UtFLMlMFuYa/k3GBwZ7UWeyAaQJ3RibSzKV/YwgFuMrzyISrLNSuL2k1bQlQQG8nl23Mu9Mowcb+mV2/3G7roshK6kOLNA0IV2SBl8/0UoNZR/x7c1lzVtVqdj0vW1SsJzgGfbt4LGRvCPyjdg+SLpYtOd/Li4Y1pvHgSRKQRrklpKeJo" "nJQ4+lXWqzYtuX9xdNH46ck2HUl56Ob4cy3/gYCJBWrAsCAwEAAQ=="
```

Hope this helps someone else!

[1]: https://tools.ietf.org/html/rfc6686#section-3.1
