---
title: Stringer Setup
---

# Stringer Setup

* Forked the project on github (https://github.com/swanson/stringer.git)
* Cloned the project to my local box:
  * git clone git@github.com:sstelfox/stringer.git ~/Documents/ruby/stringer
* Signed up for a heroku account
* gem install heroku
* heroku login (provided credentials when prompted)
* cd ~/Documents/ruby/stringer
* heroku create
  * Got: limitless-meadow-4628.herokuapp.com
* git push heroku master
* heroku config:set LOCALE=en
* heroku config:set RACK_ENV=production
* heroku config:set SECRET_TOKEN=`openssl rand -hex 24`
* heroku run rake db:migrate
* heroku domains:add feeds.stelfox.net
* Create a CNAME pointing from feeds.stelfox.net. -> limitless-meadow-4628.herokuapp.com.
* heroku restart
* At this point I had to add a credit card to my account (though it wont be charged)
* heroku addons:add scheduler
* heroku addons:open scheduler
* Added jobs to the scheduler with the following information:
  * rake fetch_feeds          1x  hourly (changed the run to happen on the hour)
  * rake cleanup_old_stories  1x  daily  (changed the run to happen 04:00)
* Optional:
  * heroku addons:add newrelic:standard # This required adding 'newrelic_rpm' to
    my gemfile, setting up the newrelic in the webinterface, downloading the
    newrelic.yml file (dumping it in the config directory), pulling the API key
    out (comment out line and remove string content), changing the app_name in
    the same file. I also logged into the NewRelic web interface and dropped the
    Real User Apdex T score to 4.0 and the App server to 0.25.
  * heroku addons:add pgbackups:auto-month
  * heroku addons:add papertrail:choklad
* Opened up `http://feeds.stelfox.net/` and set a password
* Dont import feeds
* Refresh the page -> Then go add some feeds.
* Run by hand: heroku run rake fetch_feeds
* Installed the meltdown android app
* Configured the meltdown android app:
  * Server URL: `http://feeds.stelfox.net/fever`
  * Email:      stringer
  * Password:   (The provided password)

To change the password:

  heroku run rake change_password

This requests you change the password through the command line.
