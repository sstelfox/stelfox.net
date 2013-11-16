---
title: Riak
---

# Riak

## Source RPM Source:

* http://yum.basho.com/el/6/products/SRPMS/index.html

## Installation notes

```
sudo yum update -y
sudo yum install riak -y
```

```
cat > /etc/security/limits.d/85-file_descriptors.conf << EOS
*      hard      nofile      8192
*      soft      nofile      4096
EOS
```

```
ln -s /usr/lib64/erlang/erts-5.10.2 /usr/lib64/riak/erts-5.10.2
```

For the curb gem:

```
yum install libcurl-devel -y
gem install rails
rails new proj --skip-test-unit --skip-active-record --skip-bundle

cd web_stats
cat > Gemfile << EOS
source 'https://rubygems.org'

gem 'rails', '4.0.0'

gem 'sass-rails', '~> 4.0.0'
gem 'uglifier', '>= 1.3.0'
gem 'coffee-rails', '~> 4.0.0'
gem 'therubyracer', platforms: :ruby
gem 'jquery-rails'
gem 'turbolinks'
gem 'jbuilder', '~> 1.2'

group :doc do
  gem 'sdoc', require: false
end

gem 'puma'

# Riak stuff
gem 'curb'      # Faster HTTP apparently
gem 'yajl-ruby' # Apparently faster JSON...
gem 'riak-client', require: 'riak'

# Debugger functionality
group :development, :test do
  gem 'debugger'
  gem 'pry-rails'
end
EOS

bundle
```

