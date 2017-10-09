---
title: Gitlab
---

# Gitlab

```
yum remove firewalld -y
yum install iptables-services -y
systemctl enable iptables.service
systemctl enable ip6tables.service

iptables-save > /etc/sysconfig/iptables
cp /etc/sysconfig/iptables /etc/sysconfig/ip6tables

yum install ruby ruby-devel gcc libicu libicu-devel libxml2-devel \
  libxslt-devel rubygem-bundler postgresql-devel tar patch gcc-c++ \
  vim-enhanced postfix git redis postgresql-server -y

systemctl enable redis.service
systemctl start redis.service
systemctl enable postfix.service
systemctl start postfix.service

postgresql-setup initdb
systemctl enable postgresql.service
systemctl start postgresql.service

useradd --home /home/git --create-home --shell /bin/bash git
su git -
cd
git clone https://github.com/gitlabhq/gitlab-shell.git
cd gitlab-shell
git checkout v1.7.0
cp config.yml.example config.yml
```

Edit config.yml and configure appropriately. For the short term the
`gitlab_url` should be `http://127.0.0.1:8080/`

```
./bin/install

sudo -u postgres psql
postgres=# CREATE USER git WITH PASSWORD '$password';
postgres=# CREATE DATABASE gitlabhq_production OWNER git;
postgres=# \q
```

Validate connection to the database...

```
sudo -u git -H psql -d gitlabhq_production
gitlabhq_production=> \q

su git -
cd
git clone https://github.com/gitlabhq/gitlabhq.git gitlab
cd gitlab
git checkout 6-0-stable

cp config/gitlab.yml.example config/gitlab.yml
```

The `gitlab.yml` file is setup with pretty sane defaults, may need to change
the HTTP host.

```
cp config/unicorn.rb.example config/unicorn.rb
```

This also seems pretty straight forward....

```
mkdir -p /home/git/gitlab/tmp/{pids,sockets}
mkdir -p /home/git/gitlab/public/uploads
chown -R git:git /home/git/gitlab/log/ /home/git/gitlab/tmp/
chmod -R u=rwX,g=rX,o= /home/git/gitlab/

mkdir -p /home/git/gitlab-satellites
chown -R git:git /home/git/gitlab-satellites
chmod -R u=rwX,g=rX,o= /home/git/gitlab-satellites
```

And the database setup...

```
cp config/database.yml.postgresql config/database.yml
```

Edit the file, I switch it to use the postgresql socket since I don't remember
what password I setup for the git user...

```
chmod 0640 config/database.yml

bundle install --deployment --without development test mysql aws
bundle exec rake gitlab:setup RAILS_ENV=production
```

Say 'yes' to create the database.  Take note of the admin account details
created at the end of the process:

```
#login.........admin@local.host
#password......5iveL!fe
```

And with that out of the way we should setup the git user's git config...
Ensure you're running as the git user...

```
git config --global user.name "GitLab"
git config --global user.email "gitlab@localhost"
git config --global core.autocrlf input
```

Check the application status while in `/home/git/gitlab`

```
bundle exec rake gitlab:env:info RAILS_ENV=production
```

Alright so I'm going to need to write my own init script or systemd script
since the one provided doesn't work on fedora... In the meantime to get it
running ensure you're running as the git user and...

```
cd /home/git/gitlab
RAILS_ENV=production bundle exec unicorn_rails \
  -c /home/git/gitlab/config/unicorn.rb -E production
RAILS_ENV=production bundle exec rake sidekiq:start
```

Connect to the server on port 8080 and login with the provided admin
credentials, it will force you to change your password

Only need these packages for setup:

```
yum remove ruby-devel gcc binutils cpp glibc-devel libxslt-devel \
  libgcrypt-devel postgresql-devel libgpg-error-devel libicu-devel tar patch \
  glibc-headers gcc-c++ libstdc++-devel kernel-headers libmpc mpfr -y
```

Alright TODO:

  * Create init/systemd script
  * Add nginx in front of gitlab w/ SSL
  * Update gitlab-shell configuration to point at the nginx frontend

