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

# Blow away anything that doesn't belong
pushd public/ &> /dev/null
git add -A
git reset --hard
popd &> /dev/null

# Ensure public matches upstream
git submodule sync
git submodule update --remote

# Build the site
make build

# Deploy the new changes
rsync -rtzi --delete --cvs-exclude public/ web01:sites/stelfox.net/

# Sometimes I want to make a minor change without syncing it back to github
# (little games and things with friends, changes would give away clues). In
# these situations I don't commit and deploy the changes.
if [ "${STEALTH:-}" != "true" ]; then
  # gh-page branch update
  pushd public/ &> /dev/null
  if ! git diff --quiet --exit-code; then
    git add -A
    git commit -m "Site content update"
    git push
  fi
  popd &> /dev/null

  # We may have committed to public/, if so we need to update the submodule
  # reference.
  if ! git diff --quiet --exit-code; then
    git add .
    git commit -m "Deploy new site content"
    git push
  fi
fi
