---
date: 2010-06-18 17:10:33+00:00
slug: "inspeckt-and-user-input"
title: "Inspeckt and User Input"
type: post
---

I started working on a rather large PHP based project that needed to take input
from user's of the website clients (Both form submission and URL based
navigation). These are without question the largest attack surface and most
easily exploited location for vulnerabilities to be introduced into a web
application.

For reasons outside of the topic of this post I decided to not use a pre-made
framework such as Zend to build the application. This left me in a tricky
situation as it meant I'd have to come up with a solution to validate that
input. I went searching for a standalone library to handle this validation for
me. Something that had already been tested and examined by the wonderful open
source community (Can you tell where my loyalties lie?).

I finally get pointed in the direction of [Inspekt][1]. From the Google Code
page:

> Inspekt acts as a sort of 'firewall' API between user input and the rest  of
> the application.  It takes PHP superglobal arrays, encapsulates  their data
> in an "cage" object, and destroys the original superglobal.   Data can then
> be retrieved from the input data object using a variety of  accessor methods
> that apply filtering, or the data can be checked  against validation methods.
> Raw data can only be accessed via a  'getRaw()' method, forcing the developer
> to show clear intent.

Inspekt conveniently comes with several predefined validators (called tests)
including email, zip code, alphanumeric only, credit card numbers, IP
addresses, hostnames, even custom regular expressions. Filter extend this into
a whole new area, returning only the type of information you want and stripping
everything out of the variable.

The best part is that it is written in a way that you don't have to use it
exclusively with POST and GET requests. You can create a 'cage' around any
variable or array or just put filters and tests on them. It never gets rid of
the raw input either if you ever need that again. For anyone out there that
needs to validate input from anywhere, I'd strongly recommend taking a look at
Inspekt.

[1]: http://code.google.com/p/inspekt/
