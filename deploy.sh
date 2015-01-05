#!/bin/bash

# Blow away the public directory if it exists
if [ -d public ]; then
  rm -rf public
fi

# Clone our Github pages branch into the public directory, limiting the clone
# to only information about that branch.
git clone --branch gh-pages --single-branch git@github.com:sstelfox/stelfox.net.git public

# Build the site itself
bundle exec nanoc compile

# Deploy the new changes
pushd public/ &> /dev/null
git add -A
git commit -m "Automated site content update"
git push
popd &> /dev/null