---
date: 2012-02-20 04:13:48+00:00
slug: "updating-to-a-newer-rails-on-dreamhost"
tags:
- development
- dreamhost
- gems
- gemset
- passenger
- rack
- rails
- rvm
- updates
- websites
title: "Updating to a Newer Rails on DreamHost"
type: post
---

I've started getting heavily into Ruby on Rails development and wanted to use
it in my DreamHost account. I've had a shared web account with them since 2004
and they've always treated me well. As a former PHP developer they've always
had everything that I've needed (minus PostgreSQL but everyone has their flaws
hahah) and I was sure they would have my back with Rails.

Unfortunately I found a very old version of Ruby, an old version of Rails and a
sort of locked down way to install gems. Googling and DreamHost's wiki resulted
in lots of questions but few real this-is-how-you-do-it answers. I finally
managed to piece together a solid solution to get a newer Rails running on
DreamHost through their Passenger installation. This solution doesn't fix the
version of Ruby I have to use but it gives me enough control over the actual
Rails environment that I'm willing to look past it.

For those out there, yes I am aware of Heroku and professionally I have sites
on there. Yes I know it's free for a basic account but as soon as you start
getting into real hosting the web worker dynos, database dynos, log drains all
quickly add up to a monthly price that costs me more than two years of
DreamHost hosting.

Please note that this guide assumes you are starting from a completely fresh
DreamHost user. If you've made changes to your shell files, you'll need to
adapt them for this. I also assume that *you have not yet setup the site to be
"hosted"*. What I mean by this is the domain shows up in your DreamHost account
under a heading of "Registered domains without hosting". It isn't a big deal if
you have already set it up but you'll probably need pay attention to the last
part to ensure it is setup properly.

So what will this guide get you?

* A version of Rails that is 8 minor revisions newer (3.0.11 vs 3.0.3). This
  includes several security fixes.
* An isolated gemset from other applications, preventing nightmare gem
  dependency issues when hosting several rails app in the same account
* A very well defined environment that will allow you to replicate a live
  server environment easily in a development environment

SSH into your DreamHost user, open up .bashrc file and add this:

```sh
export PATH=$HOME/.gems/bin:$HOME/opt/bin:$PATH
export GEM_HOME=$HOME/.gems
export GEM_PATH="$GEM_HOME"
export RUBYLIB="$HOME/opt/lib:$RUBYLIB"

alias gem="nice -n19 ~/opt/bin/gem"
```

And .bash_profile:

```sh
source ~/.bashrc
```

Run the following commands to setup the environment for the upcoming steps:

```sh
mkdir ~/{src,opt}
cd src
wget http://production.cf.rubygems.org/rubygems/rubygems-1.3.7.tgz
tar -xzf rubygems-1.3.7.tgz
rm -f rubygems-1.3.7.tgz
cd rubygems-1.3.7/
ruby setup.rb --prefix=$HOME/opt
cd ~/opt/bin/
ln -s gem1.8 gem
```

At this point you're ready to start using the rubygems version you just
installed. You'll want to update to the latest version locally:

```sh
gem update --system
```

Please note that you might have a newer version if one has been released since
I wrote this guide.

Because I don't need ruby documentation in my server environment I disable the
installation and generation by default by creating a ~/.gemrc file and
populating it like so:

```yaml
install: --no-rdoc --no-ri
update: --no-rdoc --no-ri
```

Install bundler and rake locally.

```sh
gem install bundler
gem install rake
```

Installing more gems than this into the local system isn't recommended. If you
define the gems for individual applications you want inside your project's
Gemfile you can prevent dependency hell when you're updating gems.

Instead we can setup RVM to handle gemsets.

```sh
bash -s stable < <(curl -s https://raw.github.com/wayneeseguin/rvm/master/binscripts/rvm-installer)
```

You'll need to source your .bash_profile file again and make sure that RVM is
up and working like so:

```sh
source ~/.bash_profile
rvm -v
```

Before we can start using project specific gemsets we need to install a
matching ruby version with the DreamHost one. This is where most people will
want to differ from my instructions but I'll tell you now it won't work.
DreamHost as of this tutorial was using ruby-1.8.7-p72 you can check this by
running the following:

```sh
ruby -v
```

We need to use this version specifically because this is what DreamHost's
passenger (aka mod_rails) will be running under. Using another version will
work while testing from your command line, but issues will crop up on your
production site. There isn't anyway to work around that short of purchasing a
VPS or dedicated server, since you're reading this I'm going to assume you've
already considered that and passed on that option. Of course you're also
welcome to completely disregard this warning as well.

So lets go ahead and install the appropriate ruby version through RVM:

```sh
rvm install ruby-1.8.7-p72
rvm use --default ruby-1.8.7-p72
```

And now we're using our own copy of the same version of ruby and it's being run
out of our home directory. Excellent. This means we can now create unique
gemsets for our projects without worrying about dependencies between them.

Lets setup a simple project for example.com using rails 3.0.11 just as a
sample. Why not 3.1.x or 3.2.x? Well the catch is another old gem running in
DreamHost's Passenger. They are running rack version 1.2.1 and as of 3.1.0
rails started requiring rack 1.3.2 or later, with rails 3.2.x it jumped all the
way up to 1.4.5 or later. Of course I found this out the hard way... This could
be worked around by running the application as a FastCGI application and I
intend to put up a guide for that as soon as I can get that environment stable.

We'll start by creating a the domain folder for it and setting up an .rvmrc
file with a unique gemset for the project.

```sh
mkdir ~/example.com
cd ~/example.com
rvm --create --rvmrc ruby-1.8.7-p72@example_com
```

Leave the directory and come back in. It should alert you about a "new or
modified" .rvmrc file in the directory. This is the one you just created and
yes you want to trust it. You trust yourself don't you?

Lets install rails 3.0.11 (DreamHost currently provides version 3.0.3).

```sh
gem install rails -v 3.0.11
```

It will take a few moments for ruby gems to go out pull down the package lists,
figure out dependencies, grab to source and install them so get a drink of
water and come back.

Great! You're back lets make sure we're running the right version of rails now:

```sh
rails -v
```

Voila! Lets get that project going with a mysql backend:

```sh
rails new . -d mysql
```

And because it's good to do lets get this under version control.

```sh
git init
git add .
git commit -m "Initial project commit"
```

Before we go any further there is a gem that needs to be added to our Gemfile.
If you bundled and ran the console right now it would be seem happy but there
is a subtle error that you wouldn't find out until the very end and it's better
to get it out of the way now.

Add the following line to the Gemfile anywhere in the main part of the config,
I prefer near the top:

```sh
gem 'rack', '1.2.1'
```

Then we'll re-bundle to make sure we have it:

```sh
bundle install
```

You can make sure your project is happy by popping open the rails console.

```sh
rails console
```

Woo! That right there is Rails 3.0.11 working on DreamHost. Since it's working
lets add another commit:

```sh
git commit -a -m "Added rack 1.2.1 and tested for working rails 3.0.11"
```

I've already setup a database for this site named "example_com" with user
"examplewebperson" and password "web_persons_password" on "mysql.example.com".
DreamHost makes this process pretty intuitive through their panel and there are
plenty of other tutorials out there to help you along if you get stuck so I'm
going to skip over that part. I also personally prefer to use sqlite3 for
development and testing as it means I don't have to run another service on my
development machines. In that light this is what my config/database.yml looks
like:

```yaml
development:
  adapter: sqlite3
  encoding: utf8
  database: db/development.sqlite3

test:
  adapter: sqlite3
  encoding: utf8
  database: db/test.sqlite3

production:
  adapter: mysql2
  encoding: utf8
  reconnect: false
  database: example_com
  pool: 5
  username: examplewebperson
  password: web_persons_password
  host: mysql.example.com
```

We'll need to add the sqlite3 gem for the test and development environment, add
this to the end of your Gemfile:

```yaml
group :development, :test do
  gem 'sqlite3'
end
```

And once again run:

```sh
bundle install
```

Lets make sure our development and then production databases are happy:

```sh
rake db:migrate
cat << EOS | sqlite3 db/development.sqlite3
CREATE TABLE "schema_migrations" ("version" varchar(255) NOT NULL);
CREATE UNIQUE INDEX "unique_schema_migrations" ON "schema_migrations" ("version");
EOS
RAILS_ENV=production rake db:migrate

echo 'show tables;' | mysql -u examplewebperson -pweb_persons_password -h mysql.example.com example_com
```

Lets commit one last time now that we have some schema:

```sh
git add .
git commit -m "Configured database"
```

We're almost there, open up config/environment.rb and add this line to the top
of this file. Pay close attention after the @ sign on that as it should be the
same as the gemset you created earlier.

```ruby
if ENV["RACK_ENV"] == "production"
  ENV['GEM_PATH'] = File.expand_path('~/.rvm/gems/ruby-1.8.7-p72@example_com') + ':/usr/lib/ruby/gems/1.8'
end
```

Last thing, since we're working around a lot of things we need to run bundle
install in the production environment to make sure we have all the dependencies
we need for the live site. This unfortunately will need to be done everytime
you manipulate your gem sets:

```sh
RAILS_ENV=production bundle install
```

Open up the DreamHost panel and find the domain your setting up under the
"Manage Domains" setting. Add Hosting to it. Make sure you are running it under
the user that we just set everything up in with a web directory set to/public.
For example my testing domain would be example.com/public. Check the checkbox
for "Passenger" and then hit the button "Fully host this domain".

As soon as you receive an email from the friendly DreamHost robot, load your
site up in a web browser and you should be greeted with the stock Rails 3.0.11
site. Note that the "About your application's environment" link will not work
in the production environment, this is intentional and expected for Rails.

This is where I leave you to develop your site. Good luck!
