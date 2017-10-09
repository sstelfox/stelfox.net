---
title: Squid Guard
---

***Note: This page is quite old and is likely out of date. My opinions may have
also changed dramatically since this was written. It is here as a reference
until I get around to updating it.***

Squid Guard is officially a "URL Rewrite Program". It takes information about
the requested page coming in and checks it against a series of ACLs,
blacklists, and whitelists in an order specified by the administrator. The
administrator can redirect offending pages to a block page (which has to be a
hosted site outside of squid).

## Installation

Don't use the "squidGuard" service, it is incorrectly defined, looking
for non-existant files, and is poorly implemented. Call squidGuard directly
from the squid config (see [Squid][1]).

NOTICE: To use squid guard at all you need to have a web server setup to
redirect sites that are denied. For this purpose I decided to install apache,
create a folder "guard" and within it a file named blocked.php that simply
prints out the contents of the $_GET variable. With the config provided this
will show the client's address, name, username, group, category of the
offending URL and the URL itself. This can be used to properly display an error
message. I am quite annoyed by how this works... I'd much prefer to just deny
the requests...

```
yum install squidGuard -y
```

### Black & White Lists

Remove the default blacklist file as we're going to use another one. This is a
necessary step to continue using the rest of these instructions. If you don't
wan to use the Shalla Lists, you'll have to adapt to the instructions given
however they shouldn't differ much between different lists.

```
[root@localhost ~]# rm -f /var/squidGuard/blacklists.tar.gz
[root@localhost ~]# mkdir -p /var/squidGuard/blacklists
[root@localhost ~]# mkdir -p /var/squidGuard/whitelists/custom/
[root@localhost ~]# touch /var/squidGuard/whitelists/custom/domains
[root@localhost ~]# touch /var/squidGuard/whitelists/custom/urls
```

Download a blacklist file, [Shalla List][2] seems to be the defacto/good one.

```
[root@localhost ~]# curl http://www.shallalist.de/Downloads/shallalist.tar.gz -o /var/squidGuard/blacklists/shallalist.tar.gz 2>/dev/null
[root@localhost ~]# curl http://www.shallalist.de/Downloads/shallalist.tar.gz.md5 -o /var/squidGuard/blacklists/shallalist.tar.gz.md5 2> /dev/null
[root@localhost ~]# cat /var/squidGuard/blacklists/shallalist.tar.gz.md5 && md5sum /var/squidGuard/blacklists/shallalist.tar.gz
c50fdc59593bc3e5c5863e2b120f6fed  shallalist.tar.gz
c50fdc59593bc3e5c5863e2b120f6fed  /var/squidGuard/blacklists/shallalist.tar.gz
```

Note: the md5sums are the same (we received an intact download, the sums will
be different everytime it updates).

Now that we've verified the blacklists lets extract them.

```
[root@localhost ~]# cd /var/squidGuard
[root@localhost squidGuard]# tar -xzvf shallalist.tar.gz --strip-components 1
[root@localhost squidGuard]# chown -R squid:squid /var/squidGuard/
```

## Configuration

By default, squidGuard tries to store it's logfiles in `/var/log/squidGuard`,
however, since squid starts up squidGuard, squidGuard will be running under the
squid user. This is important as the squid user won't have permission to
`/var/log/squidGuard`. We should switch it too `/var/log/squid`, and ensure
that `/var/squidGuard/blacklists` are owned by squid with the squid group.

```
# Configure locations for the rest of squidGuard's files
dbhome /var/squidGuard
logdir /var/log/squid

# Time aliases
# s = sun, m = mon, t =tue, w = wed, h = thu, f = fri, a = sat

# Hours during the work day
time workhours {
  weekly mtwhf 08:00 - 12:00
  weekly mtwhf 13:00 - 16:30
}

# Source ACLs
src localnets {
  ip 155.42.89.0/24
}

# Destination whitelists (overrides)
dest whitelists_custom {
  domainlist  whitelists/custom/domains
  urllist   whitelists/custom/urls
}

# Destination blacklists - Descriptions from shallalist.de

# All about advertising: This includes sites offering banners and banner
# creation as well as sites delivering banners to be shown in webpages.
# Advertising companies are listed, too.
dest adv {
  domainlist  blacklists/adv/domains
  urllist   blacklists/adv/urls
}

# Sites of obvious aggressive content. This coveres hate speech and all
# kinds of racism.
dest aggressive {
  domainlist  blacklists/aggressive/domains
  urllist   blacklists/aggressive/urls
}

# Sites of breweries, wineries and destilleries. This category also covers
# sites that explain howto make beer, wines and spirits.
dest alchohol {
  domainlist  blacklists/alcohol/domains
  urllist   blacklists/alcohol/urls
}

# This category covers sites providing vpn services to the public. The
# focus is on vpn sites used to hide the origin of the traffic like
# tor nodes. The category does not include company vpn accesses.
dest anonvpn {
  domainlist  blacklists/anonvpn/domains
  urllist   blacklists/anonvpn/urls
}

# All around motorcycles. Included are vendor sites, resellers, fan and
# hobby pages as well as and suppliers. Scooters included.
dest automobile_bikes {
  domainlist  blacklists/automobile/bikes/domains
  urllist   blacklists/automobile/bikes/urls
}

# All around motorboats. Included are vendor sites, resellers, fan and
# hobby pages as well as and suppliers. Not included are travel tips
# (this can be found in recreation/travel).
dest automobile_boats {
  domainlist  blacklists/automobile/boats/domains
  urllist   blacklists/automobile/boats/urls
}

# All around cars. Included are automobile companies and automotive
# suppliers.
dest automobile_cars {
  domainlist  blacklists/automobile/cars/domains
  urllist   blacklists/automobile/cars/urls
}

# All around planes ranging from small one and two seaters up to the
# large traffic planes, old and new, private, commercial and military.
# Vendors and supplier are included (airports are not). Helicopter
# sites are included as well.
dest automobile_planes {
  domainlist  blacklists/automobile/planes/domains
  urllist   blacklists/automobile/planes/urls
}

# Sites for realtime chatting and instant messaging. Everything that
# is not realtime is included in -> forum.
dest chat {
  domainlist  blacklists/chat/domains
  urllist   blacklists/chat/urls
}

# Sites that lure with free of charge services but then give you a
# costly abbonement (written somewhere in tiny letters nearly
# unreadable).
dest costtraps {
  domainlist  blacklists/costtraps/domains
  urllist   blacklists/costtraps/urls
}

# Sites to contact people for love and live together. He seeks her,
# she seeks him and so on.
dest dating {
  domainlist  blacklists/dating/domains
  urllist   blacklists/dating/urls
}

# This covers mostly filesharing, p2p and torrent sites. Other
# download sites (for software, wallpapers, ..) are included as well.
dest downloads {
  domainlist  blacklists/downloads/domains
  urllist   blacklists/downloads/urls
}

# Sites offering drugs or explain how to make drugs (legal and non
# legal). Covers tabacco as well as viagra and similar substances.
dest drugs {
  domainlist  blacklists/drugs/domains
  urllist   blacklists/drugs/urls
}

# All domains where people log in from one obtaining a dynmic IP
# address. Dynamic sites can be most harmless as well as carry
# redirecting proxies to bypass the webfilter or porn, games or
# anything else why may be inappropiate.
dest dynamic {
  domainlist  blacklists/dynamic/domains
  urllist   blacklists/dynamic/urls
}

# Home pages of schools, colleges and universities.
dest education {
  domainlist  blacklists/education/schools/domains
  urllist   blacklists/education/schools/urls
}

# Home page of banking companies are listed here. This is not
# restricted to online banking.
dest finance_banking {
  domainlist  blacklists/finance/banking/domains
  urllist   blacklists/finance/banking/urls
}

# Sites of insurance companies, about information about insurances
# and link collections concering this subject.
dest finance_insurance {
  domainlist  blacklists/finance/insurance/domains
  urllist   blacklists/finance/insurance/urls
}

# Sites one can apply for loans and mortgages or can obtain
# information about this business.
dest finance_moneylending {
  domainlist  blacklists/finance/moneylending/domains
  urllist   blacklists/finance/moneylending/urls
}

# Sites about all types of realestate, bying and selling homes,
# finding appartments for rent and selling.
dest finance_realestate {
  domainlist  blacklists/finance/realestate/domains
  urllist   blacklists/finance/realestate/urls
}

# Sites about the stock exchange market, trading of stocks and stock
# options as well as sites related to this subject.
dest finance_trading {
  domainlist  blacklists/finance/trading/domains
  urllist   blacklists/finance/trading/urls
}

# All financial pages that do not fit in the financial categories
# above.
dest finance_other {
  domainlist  blacklists/finance/other/domains
  urllist   blacklists/finance/other/urls
}

# All sites about astrology, horoscopes, numerology, palm reading
# and so on; sites that offer services to forsay the future.
dest fortunetelling {
  domainlist  blacklists/fortunetelling/domains
  urllist   blacklists/fortunetelling/urls
}

# Discussion sites. Covered explicit forum sites and some blogs.
# Sites where people can discuss and share information in a non
# interactive/realtime way. Realtime discussions are covered with
# chat.
dest forum {
  domainlist  blacklists/forum/domains
  urllist   blacklists/forum/urls
}

# Sites offering the possibility to win money. Poker, Casino,
# Bingo and other chance games as well as betting sites. Differs
# from -> hobby/games in the aspect of winning or loosing money
# or being lured to do so.
dest gamble {
  domainlist  blacklists/gamble/domains
  urllist   blacklists/gamble/urls
}

# Sites belonging to the goverment of a country, county or city.
dest government {
  domainlist  blacklists/government/domains
  urllist   blacklists/government/urls
}

# Sites with information and discussions about security weaknesses
# and how to exploit them. Sites offering exploits are listed as
# well as sites distributing programs that help to find security
# leaks.
dest hacking {
  domainlist  blacklists/hacking/domains
  urllist   blacklists/hacking/urls
}

# Sites concering food and food preparation.
dest hobby_cooking {
  domainlist  blacklists/hobby/cooking/domains
  urllist   blacklists/hobby/cooking/urls
}

# Sites related to games. This includes descriptions, news and
# general information about games. No gamble sites.
dest hobby_games-misc {
  domainlist  blacklists/hobby/games-misc/domains
  urllist   blacklists/hobby/games-misc/urls
}

# Sites about online games (all kinds of browserbased games). The
# games are for fun only (no gamble).
dest hobby_games-online {
  domainlist  blacklists/hobby/games-online/domains
  urllist   blacklists/hobby/games-online/urls
}

# Sites about gardening, grewing plants, fighting bugs and
# everything else related to gardening.
dest hobby_gardening {
  domainlist  blacklists/hobby/gardening/domains
  urllist   blacklists/hobby/gardening/urls
}

# Sites about all topics concerning pets: description, raise,
# food, looks, fairs, favorite pet stories and so on.
dest hobby_pets {
  domainlist  blacklists/hobby/pets/domains
  urllist   blacklists/hobby/pets/urls
}

# Sites about everything required to create a cozy home (interior
# design and assesoirs).
dest homestyle {
  domainlist  blacklists/homestyle/domains
  urllist   blacklists/homestyle/urls
}

# Sites of hospitals and medical facilities.
dest hospitals {
  domainlist  blacklists/hospitals/domains
  urllist   blacklists/hospitals/urls
}

# Sites specialized on hosting images, photogalleries and so on.
dest imagehosting {
  domainlist  blacklists/imagehosting/domains
  urllist   blacklists/imagehosting/urls
}

# Home pages of Internet Service Providers. Site of companies
# offering webspace only are now being added, too.
dest isp {
  domainlist  blacklists/isp/domains
  urllist   blacklists/isp/urls
}

# Portals for job offers and job seekers as well as the career
# and work-for-us pages of companies.
dest jobsearch {
  domainlist  blacklists/jobsearch/domains
  urllist   blacklists/jobsearch/urls
}

# Online libraries and sites where you can obtain and/or read
# e-books. Book shops are not listed here but under shopping.
dest library {
  domainlist  blacklists/library/domains
  urllist   blacklists/library/urls
}

# Sites of military facilites or related to the armed forces.
dest military {
  domainlist  blacklists/military/domains
  urllist   blacklists/military/urls
}

# Model agency, model and supermodel fan pages and other model
# sites presenting model photos. No porn pictures.
dest models {
  domainlist  blacklists/models/domains
  urllist   blacklists/models/urls
}

# Sites offering cinema programs, information about movies and actors.
# Sites for downloading video clips/movies (as long it is legal) are
# included as well.
dest movies {
  domainlist  blacklists/movies/domains
  urllist   blacklists/movies/urls
}

# Sites that offer the download of music, information about music
# groups or music in general.
dest music {
  domainlist  blacklists/music/domains
  urllist   blacklists/music/urls
}

# Sites presenting news. Homepages from newspapers, magazines and
# journals as well as some blogs.
dest news {
  domainlist  blacklists/news/domains
  urllist   blacklists/news/urls
}

# Sites offering podcasts or podcast services.
dest podcasts {
  domainlist  blacklists/podcasts/domains
  urllist   blacklists/podcasts/urls
}

# Sites of political parties, political organisations and associations;
# sites with political discussions.
dest politics {
  domainlist  blacklists/politics/domains
  urllist   blacklists/politics/urls
}

# Sites about all kinds of sexual content ranging from bare bosoms to
# hardcore porn and sm.
dest porn {
  domainlist  blacklists/porn/domains
  urllist   blacklists/porn/urls
}

# Domains and urls of TV and radio stations, regardless whether they
# offer any programs on the site or just displaying a static page. The
# sites offering streams are still collected in webradio and webtv,
# respectively.
dest radiotv {
  domainlist  blacklists/radiotv/domains
  urllist   blacklists/radiotv/urls
}

# Humorous pages, comic strips, funny stories, everything which makes
# people laugh.
dest recreation_humor {
  domainlist  blacklists/recreation/humor/domains
  urllist   blacklists/recreation/humor/urls
}

# Sites dedicated to martial arts such karate, kung fu, taek won do as
# well as fighting sports sites like ufc. All site listed in this
# category are also part of sports. This category is meant for users
# who wish to allow sports but no "aggressive" kind of sports.
dest recreation_martialarts {
  domainlist  blacklists/recreation/humor/domains
  urllist   blacklists/recreation/humor/urls
}

# Sites of restaurants as well as restaurant descriptions and
# comentaries.
dest recreation_restaurants {
  domainlist  blacklists/recreation/humor/domains
  urllist   blacklists/recreation/humor/urls
}

# All about sports: sports teams, sport discussions as well as
# information about sports people and the varios sports themselves.
dest recreation_sports {
  domainlist  blacklists/recreation/humor/domains
  urllist   blacklists/recreation/humor/urls
}

# Sites with information about foreign countries, travel companies,
# travel fares, accomondations and everything else that has to do
# with travel including travel blogs.
dest recreation_travel {
  domainlist  blacklists/recreation/humor/domains
  urllist   blacklists/recreation/humor/urls
}

# Sites about treatments for feeling internally and externally healthy
# and beautiful again.
dest recreation_wellness {
  domainlist  blacklists/recreation/wellness/domains
  urllist   blacklists/recreation/wellness/urls
}

# Sites that actively help to bypass url filters by accepting urls via
# webform and play a proxing and redirecting role.
dest redirector {
  domainlist  blacklists/redirector/domains
  urllist   blacklists/redirector/urls
}

# Sites with religious content: all kind of churches, sects, religious
# interpretations and so on.
dest religion {
  domainlist  blacklists/religion/domains
  urllist   blacklists/religion/urls
}

# Sites offering the service to remotely access computers, expecially (but not
# limited to going) through firewalls. This includes using a third party
# computer. Traditional VPN is not covered.
dest remotecontrol {
  domainlist  blacklists/remotecontrol/domains
  urllist   blacklists/remotecontrol/urls
}

# Sites that offer the download of ringtones or present other informations
# about ringtones.
dest ringtones {
  domainlist  blacklists/ringtones/domains
  urllist   blacklists/ringtones/urls
}

# Sites of institutions as well as of amateurs about all topics of astronomy.
dest science_astronomy {
  domainlist  blacklists/science/astronomy/domains
  urllist   blacklists/science/astronomy/urls
}

# Sites of institutions as well as of amateurs about all topics of chemistry.
dest science_chemistry {
  domainlist  blacklists/science/chemistry/domains
  urllist   blacklists/science/chemistry/urls
}

# Collection of seach engines and directory sites.
dest searchengines {
  domainlist  blacklists/searchengines/domains
  urllist   blacklists/searchengines/urls
}

# Sites explaining the biological functions of the body concerning sexuality
# as well as sexual health; this, too, covers sites for teenagers with
# questions about firstlove, first sex, and subjects related to this topics.
# This category does not cover porn.
dest sex_education {
  domainlist  blacklists/sex/education/domains
  urllist   blacklists/sex/education/urls
}

# Sites selling and presenting sexy lingerie or lingerie in a sexy manner.
dest sex_lingerie {
  domainlist  blacklists/sex/lingerie/domains
  urllist   blacklists/sex/lingerie/urls
}

# Sites offering online shopping and price comparisons.
dest shopping {
  domainlist  blacklists/shopping/domains
  urllist   blacklists/shopping/urls
}

# Sites bringing people together (social networking) be it for friendship
# or for business.
dest socialnet {
  domainlist  blacklists/socialnet/domains
  urllist   blacklists/socialnet/urls
}

# Sites that tries to actively try to install software (or lure the user
# in doing so) in order to spy the surfig behaviour (or worse). This
# category includes trojan and phishing sites. The homecalling site
# where the collecting information is sent are listed, too.
dest spyware {
  domainlist  blacklists/spyware/domains
  urllist   blacklists/spyware/urls
}

# Site keeping an eye on where you surf and what you do in a passive. Covers
# web bugs, counters and other tracking mechanism in web pages that do not
# interfere with the local computer yet collecting information about the
# surfing person for later analysis. Sites actively spying out the surfer
# by installing software or calling home sites are not covered with tracker
# but with -> spyware.
dest trackers {
  domainlist  blacklists/tracker/domains
  urllist   blacklists/tracker/urls
}

# Kind of white list to allow necessary downloads from vendors. Thought as
# a correction to the downloads category.
dest updatesites {
  domainlist  blacklists/updatesites/domains
  urllist   blacklists/updatesites/urls
}

# Domains that can be used to shorten long URLs. The orginal (long) URL will
# be accessed after the the short URL has been requested from the shortener.
# This distinguishes this category from redirector where the orginal URL is
# never accessed directly.
dest urlshortener {
  domainlist  blacklists/urlshortener/domains
  urllist   blacklists/urlshortener/urls
}

# Sites about killing and harming people. Covers anything about brutality
# and beastiality.
dest violence {
  domainlist  blacklists/violence/domains
  urllist   blacklists/violence/urls
}

# Collection of sites offering programs to break licence keys, licence
# keys themselves, cracked software and other copyrighted material.
dest warez {
  domainlist  blacklists/warez/domains
  urllist   blacklists/warez/urls
}

# Sites offering all kinds of weapons or accessories for weapons: Firearms,
# knifes, swords, bows,... . Armory shops are included as well as sites
# holding general information about arms (manufacturing, usage).
dest weapons {
  domainlist  blacklists/weapons/domains
  urllist   blacklists/weapons/urls
}

# Sites that offer web-based email services.
dest webmail {
  domainlist  blacklists/webmail/domains
  urllist   blacklists/webmail/urls
}

# Sites that enable user to phone via Internet/WWW. Any site where users
# can voice-chat with each other (normal chat sites, where users type their
# messages are part of chat, not webphone).
dest webphone {
  domainlist  blacklists/webphone/domains
  urllist   blacklists/webphone/urls
}

# Sites that offer listening to music and radiostreams.
dest webradio {
  domainlist  blacklists/webradio/domains
  urllist   blacklists/webradio/urls
}

# Collection of site offering TV streams via world wide web.
dest webtv {
  domainlist  blacklists/webtv/domains
  urllist   blacklists/webtv/urls
}


acl {
  localnets within workhours {
    pass whitelists_custom !adv !aggressive !alchohol !anonvpn !automobile_bikes !automobile_boats !automobile_cars !automobile_planes !chat !costtraps !dating !downloads !drugs !dynamic !fortunetelling !gamble !hobby_games-misc !hobby_games-online !hobby_gardening !hobby_pets !homestyle !hospitals !in-addr !imagehosting !isp !models !movies !music !podcasts !politics !porn !radiotv !recreation_humor !recreation_martialarts !recreation_restaurants !recreation_sports !recreation_travel !recreation_wellness !redirector !religion !remotecontrol !ringtones !sex_education !sex_lingerie !socialnet !spyware !trackers !violence !warez !weapons !webphone !webtv all
    redirect http://127.0.0.1/guard/blocked.php?clientaddr=%a&clientdomain=%n&clientuser=%i&clientgroup=%s&targetgroup=%t&url=%u&uri=%p
  } else {
    pass whitelists_custom !adv !costtraps !in-addr !redirector !ringtones !spyware !trackers all
    redirect http://127.0.0.1/guard/blocked.php?clientaddr=%a&clientdomain=%n&clientuser=%i&clientgroup=%s&targetgroup=%t&url=%u&uri=%p
  }

  default {
    pass updatesites none
    redirect http://127.0.0.1/guard/blocked.php?clientaddr=%a&clientdomain=%n&clientuser=%i&clientgroup=%s&targetgroup=%t&url=%u&uri=%p
  }
}
```

## Live Config Changes

The squid command "squid -k reconfigure" DOES re-evaluate squidGuard config
changes as well. This make it very easy to quickly adjust things all over the
server without a significant service interruption.

## Testing and Diagnostics

So what I've found in my experimentation is that if there is an issue with
squidGuard starting up squid will still success and there will probably not be
any errors anywhere, it will simply not block anything. This is obviously not
an ideal situation. To test and make sure that your configuration is good (or
possibly see the errors that may be preventing the filtering from working) run
the following command:

```
[root@localhost ~]# squidGuard -c /etc/squid/squidGuard.conf -C all
```

It will go through and build the database files for every category defined in
the configuration then verify that everything is in order. If an error does
occur you'll see the message:

```
2011-09-20 12:15:50 [7140] Going into emergency mode
```

Look on the line above it and it you'll have to figure out the issue based on
that message.

NOTE: After performing this command all of the database files will be owned by
root! This won't work, fix the issue running the following command:

```
[root@localhost ~]# chown -R squid:squid /var/squidGuard/*
```

Additional permission issues can (usually) be resolved with the following
commands:

```
[root@localhost ~]# chown -R root:squid /etc/squid
[root@localhost ~]# chmod 640 /etc/squid/*
```

To test individual rules to make sure things are being redirected or blocked
correctly you can test squidGuard with something along the following lines:

```
[root@localhost ~]# su squid -s /bin/bash -
bash-4.2$ echo "http://porn.com 10.0.0.1/ - - GET" | squidGuard -d -c /etc/squid/squidGuard.conf
```

It will either return nothing (passes the check) or return a URL to redirect
the user too (failed the check). You can replace the 10.0.0.1 with an IP of a
machine you'd like to test the rules with.

## Security Notes

squidGuard is an additional layer of protection against known bad sites. It can
not possibly catch all of the bad sites but it does help. For any general
browsing that you don't want to restrict the content of, I strongly suggest
including the following groups as exclusions. They will help promote anonymous
safe browsing.

* adv
* costtraps
* in-addr
* redirector
* ringtones
* spyware
* trackers

The only one that may cause issues is the "in-addr" one which blocks going to
IP addresses directly. I personally get around this by including the sites I
want to access directly in my whitelist file.

## Sample Error Page

```php
<?php
  function uuid() {
    return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
      // 32 bits for "time_low"
      mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),

      // 16 bits for "time_mid"
      mt_rand( 0, 0xffff ),

      // 16 bits for "time_hi_and_version",
      // four most significant bits holds version number 4
      mt_rand( 0, 0x0fff ) | 0x4000,

      // 16 bits, 8 bits for "clk_seq_hi_res",
      // 8 bits for "clk_seq_low",
      // two most significant bits holds zero and one for variant DCE1.1
      mt_rand( 0, 0x3fff ) | 0x8000,

      // 48 bits for "node"
      mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
    );
  }
?>
<!DOCTYPE>
<html>
  <head>
    <title>This Site Has Been Blocked</title>
    <link href="data:image/x-icon;base64,AAABAAEAEBAAAAAAAABoBQAAFgAAACgAAAAQAAAAIAAAAAEACAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAAAeRtNANCRtwCwXowA0Z66ANSZvQD00eUA9dbrAP/7/wCpT4QAlzttAKpShACoVYQA9N/rAKZbhACrVocApl2KAOzF3QCxW40A4q7PAHEEQAC1Z5YAjSRgAOzC3gDuwt4AjiVjAK9aiwD86PUAsl+RAH4ZUgCzX5EA0Zq5AJQzaQDHgKsA//T+AJcybwCFHlgAplSDAMiErgD41u0Aq1KGAKtVhgDcpcgAmUVyAL5woAC+c6AAeBRNAM6StABnBzkA0pS6AHwhUADDgaYAoVJ+ALdjlQDHgqkAplWHAMiHrwCnV4QAjBxcAOq92gCbQnMArFyKAKBAdgDOk7gAijNiANGTuAB6HU4A78zjAKBKeQCDGVQAtGiTAJUzawD10ekAqFCCAJg3bgCFJV0AhSdaANunxwD54/IAvXWfAN+oygDCdqIAjjBjAIIVUgCjS30Axn6oAPTQ5wCEHFUAt2aXAMiCqwDIhq4AuXaaAL9yoACOJmEAjydkAKFEewCeTHgAoEd7AJAwZAC3ZZUAlTVqANabwACnUYcAqVaEAHgLSADJj68A+N/xALh4oQDcqcYAzY61AJAmYgCgQnYAr1+NAMJ5pADjr88As2OQAIEbVACSNGgA5LbSANedvgCnT4IA99PpAJk0cQDbo8cAyoywAL96nwDDeaUA/er4AOKxzQCCGFUAtmSUANWavwD+9PsA1p2/ANaewgD20+oAxYerALdrlwCHHVsAyYWuAMiIrgD41+0At3WaAOnB2QB3EEcA3abIAIwoYQCfP3gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAXW5vDy8gVx0AAAAAAAAAKBYfaQSEaYgkUwAAAAAAOmF1OQ59DY5gTDAuAAAAAGhFZFQrNHMDQDKQFAAAAF6BAVt4RHBcInwzPSVLAACKklI8bHGLj4A1SWJ0IwAAGUopDIlDfyoFTWMKQnoAAJM+Z0YFBwg7coOMC0dmAAA3X4ImUFaHjQY4LRpPAAAAABWFdhtIJ3kTWkE2HAAAAAAQEllOahgXezF+CQAAAAAAAGtYd22REWVRHgAAAAAAAAAAAIYsIVUCPwAAAAAAAAAAAAAAAAAAAAAAAAAAAP//AAD//wAA8A8AAOAHAADAAwAAwAMAAIABAACAAQAAgAEAAIABAACAAwAAwAMAAMAHAADgDwAA+B8AAP//AAA=" rel="icon" type="image/x-icon" />
    <link href="data:image/x-icon;base64,AAABAAEAEBAAAAAAAABoBQAAFgAAACgAAAAQAAAAIAAAAAEACAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAABNOB4ATzobAH5kNABSORgAUTobALl+SgBSOhsAUjwYAFA8IQBUPBgATj4nAFY8GACyilMAWD0bAIZmOgBZQR4AW0AbAEEuEwBCLxYAXUMbAFxEHgDounUAX0QeAGRIGABLNxwASjgfAPDCewBPORkATzocAJxsQwBTPBkAVDwZAFU8GQBWPBkAhGY7AMikawBaQBwA/cl+AFlCIgBFMhcAoYFVAF9IIgBfRiUASDMaAIpyTQBJNhoATjkaAE46HQBQORoAUTkaAFI5GgBPOyAAaUwuAFI8GgBkUTQAUj0dAFM9HQBVPBoAVjwaAFQ9HQCbekoAWT8aAF5HIABeRSMASjYbAEs2GwBKNx4ATDgYAHteNwBNOBgATzgYAE45GwBOOh4AUDkbAE86HgBRORsAUjsYAMuWXgD0xX0A27JyAFM9HgBUPR4AWj4YAFk/GwBaPxsAVkEhAFhCJACKZEAAVUQqAFpEIQBeQx4ARDEWAGFFGwBiRh4AYUgkANesagBNOBkATzkcAE46HwBTOxkAVDsZAFY+GQBWPxwAblQtAFVBIgD7y34AVkEiALKPXQBbQxYAV0EiAJZrFwBcRCIA6b15AEg1GgBLOBoAZU4lAEs6IABSOxoAUzsaAIBmNgBpUCsAVDsaAFM8HQBWOxoAVz4aAFY/HQBYPhoA+Mt/AFo+GgD8yH8AhGk/AFtBGgBCMBUAQzAVAEQwFQCHa0UAYkYXAEg0GABMNxgAtHtHAEk5HgBKOR4ATDgbAEs5HgBMOR4AUToYAFE7GwBSOxsAhl46AFc9GAD3yIAAWkAYAFxBGwBcQh4AXkkhAEczFgB5Vy8ARzQZAEo0GQBMNxkAfGIsAE05HwB9YDgAUDoZAFE6GQBSOhkAUzoZAFM9GQBQPiUA+Md+AFc9GQCyj1cAbVQwAOmzcABcQRwAW0QcAFpDIgBGMxcAY0YZAEczFwBeRisAZUkZAEs5IABJOyYATjkgAFA6GgBROhoAUjoaAFU9GgBWPRoAVz0aAFg9GgBZQBoA4bd0AFZAIwCXahgAQS8VAEMvFQBbRSAAYEMaAFxDIwCecBgAlmY5AHpiLgBMNhgASjgeAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAtkKQAIzNobiPjUpIYi9ICLESgqKJhpeItRfGPpopWY4rxSJ/FXhsw27JoHcCy3OfnYTErKmWZ1KVslwUwK81QXEnW4U8JXAtEZteDqtrcmFAs7OzRIFpGl9PwSMst55HN7m5YAxOKDZYqHQcJL8efTe6MS6thwEDpR9MHlMQIWZQpDGcTTMEMLqmCWM6VJgPerlJyldLkrm6uh8LeXvHWlG5RYu0pLkGk5N1vb5jgF07uYoFGTGjk6c1k3ZUVFNaOLpDHRikuZMHZGQgOYOumTu5zJQbMrkxuzoNfr2qE1p6o0Y0kTG6MQZkvHx8ZT0WVm1qCmhVwlVtJrBvP2/IKgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" rel="icon" type="image/x-icon" />
    <style type="text/css">
      @font-face {
        font-family: 'Tangerine';
        src: local('Tangerine'), url('http://themes.googleusercontent.com/static/fonts/tangerine/v1/HGfsyCL5WASpHOFnouG-RKCWcynf_cDxXwCLxiixG1c.ttf') format('truetype');
      }
      body {
        font-family: serif;
        padding: 0;
        margin: 0;
        background: #FFF8DC;
      }
      #page {
        border: 1px solid #CC9;
        border-top: 0px;
        position: relative;
        width: 960px;
        margin: auto;
        background: #FFF;
        height: 95%;
        box-shadow: 0 0 2em #CC9;
        overflow: hidden;
        border-bottom-left-radius: 1em;
        border-bottom-right-radius: 1em;
      }
      #main {
        position: relative;
        overflow: hidden;
      }
      #content {
        overflow: auto;
        padding: 1em 2em;
        box-shadow: inset 0 0 0.5em #CC9;
        height: 100%;
      }
      header {
        background: #CFC;
        font-family: 'Tangerine', serif;
        font-size: 2em;
        max-height: 80px;
        padding-top: 0.25em;
      }
      header h1,h4 {
        padding: 0;
        margin: 0;
        margin-left: 1.0em;
        display: inline-block;
        text-decoration: underline;
      }
      footer {
        background: #CFC;
        border-bottom-left-radius: 1em;
        border-bottom-right-radius: 1em;
        padding: 0.3em 0;
        font-size: 0.7em;
        position: absolute;
        width: 100%;
        bottom: 0px;
        text-align: center;
      }
      nav p {
        margin-bottom: 0;
      }
      nav {
        background: #CFC;
        margin: 0;
        padding: 0 0 0 1em;
        font-size: 0.8em;
        width: 16%;
        height: 100%;
        float: left;
        box-shadow: 0 4px 6px 0 #CC9;
      }
      nav ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      nav ul li {
        padding-left: 1em;
      }
      nav ul li a {
        color: #552;
        text-decoration: none;
      }
      nav ul li a:hover {
        text-decoration: underline;
      }
      table {
        margin: auto;
        font-size: 0.8em;
        font-family: sans-serif;
      }
      th {
        text-align: left;
        vertical-align: top;
        width: 100px;
        font-weight: normal;
      }
    </style>
  </head>
  <body>
    <div id='page'>
      <header>
        <h1>BedroomProgrammers.net</h1>
        <h4>Intricacy requires well rested minds</h4>
      </header>
      <div id="main">
        <nav>
          <p>Informative Links:</p>
          <ul>
            <li>- <a href="#">Acceptable Use Policy</a></li>
          </ul>
        </nav>
        <div id="content">
          <section>
            <h2>This Page Has Been Blocked</h2>
            <p>This could have happened because it is currently business hours and you are trying to get too a site that is in our business hours blacklist, it could have been blocked for safety reasons (for example the site is known to host malware or attempt to phish information from unsuspecting users), or it could be a mistake.</p>
            <p>If this is a mistake and you feel that this site should be removed from the blacklist, please email the administrator with the information provided below. Please note how urgent the access is required as it can take up to 48 hours for a request to be processed. The administrator reserves the right to reject requests for removal if they deem the site should not be accessed or information is missing from the request.</p>
            <p>Please note, that business hours are Monday-Friday 8:00am to 4:30pm. The business hours blacklist is disabled automatically during lunch time (12:00pm to 1:00pm) and outside of business hours. IT doesn't take holidays... neither does this system.</p>
          </section>
          <hr />
          <section>
            <table>
              <tr>
                <th>Timestamp</th>
                <td><?php echo date(DATE_W3C); ?></td>
              </tr>
              <tr>
                <th>Request ID</th>
                <td><?php echo uuid(); ?>
              </tr>
              <tr>
                <th>IP Address</th>
                <td><?php echo $_GET['clientaddr']; ?></td>
              </tr>
              <tr>
                <th>Hostname</th>
                <td><?php echo $_GET['clientname']; ?></td>
              </tr>
              <tr>
                <th>User</th>
                <td><?php echo $_GET['clientuser']; ?></td>
                </tr>
              <tr>
                <th>Client Group</th>
                <td><?php echo $_GET['clientgroup']; ?></td>
              </tr>
              <tr>
                <th>URL Group</th>
                <td><?php echo $_GET['targetgroup']; ?></td>
              </tr>
              <tr>
                <th>Blacklisted URL</th>
                <td><?php echo $_GET['url'] . $_GET['uri']; ?></td>
              </tr>
            </table>
          </section>
        </div>
      </div>
      <footer>&copy 2011 Me!</footer>
    </div>
  </body>
</html>
```

[1]: {{< relref "notes/squid.md" >}}
[2]: http://www.shallalist.de/
