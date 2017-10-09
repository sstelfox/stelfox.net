#!/bin/bash

# Blow away the public directory if it exists
if [ -d public ]; then
  rm -rf public
fi

# Clone our Github pages branch into the public directory, limiting the clone
# to only information about that branch.
git clone --branch gh-pages --single-branch . public

# Build the site
make build

# Deploy the new changes
pushd public/ &> /dev/null
git add -A
git commit -m "Automated site content update"
git push
popd &> /dev/null

# Sync the file to the webserver as well
rsync -vrz --delete public/ web01:sites/stelfox.net/
