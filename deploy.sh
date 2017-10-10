#!/bin/bash

set -o errexit
set -o errtrace
set -o pipefail
set -o nounset

function error_handler() {
  echo "Error occurred in ${3} executing line ${1} with status code ${2}"
}

# Please note basename... is intentionally at the end as it's a command that
# will effect the value of '$?'
trap 'error_handler ${LINENO} $? $(basename ${BASH_SOURCE[0]})' ERR

# Diagnostic logging when necessary
if [ "${DEBUG:-}" = "true" ]; then
  set -o xtrace
fi

# Blow away the public directory if it exists
if [ -d public ]; then
  rm -rf public
fi

# Clone our Github pages branch into the public directory, limiting the clone
# to only information about that branch.
git clone --branch gh-pages --single-branch git@github.com:sstelfox/stelfox.net.git public

# Build the site
make build

# Deploy the new changes
pushd public/ &> /dev/null
git add -A
git commit -m "Site content update"
git push
popd &> /dev/null

# Sync the file to the webserver as well
rsync -vrz --delete --cvs-exclude public/ web01:sites/stelfox.net/
