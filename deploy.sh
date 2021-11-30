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

# Ensure published matches the repository
git submodule init
git submodule sync
git submodule update --remote

# Blow away anything that doesn't belong
pushd published/ &> /dev/null
git add -A
git reset --hard
popd &> /dev/null

# Git doesn't track the branch head very well, set it explicitly
pushd published/ &> /dev/null
git checkout gh-pages
git pull origin gh-pages
popd &> /dev/null

# Build the site
make build

rsync -rczi --delete --exclude .git public/ published/

# Sometimes I want to make a minor change without syncing it back to github
# (little games and things with friends, changes would give away clues). In
# these situations I don't commit and deploy the changes.
if [ "${STEALTH:-}" != "true" ]; then
  # gh-page branch update
  pushd published/ &> /dev/null
  if ! git diff --quiet --exit-code; then
    git add -A
    git commit -m '' --allow-empty-message
    git push origin HEAD:gh-pages
  fi
  popd &> /dev/null

  # We may have committed to public/, if so we need to update the submodule
  # reference.
  if ! git diff --quiet --exit-code; then
    git add -A
    git commit -m '' --allow-empty-message
    git push
  fi
fi

# Deploy the new changes
rsync -rczi --delete --cvs-exclude published/ singing-evening-road.stelfox.net:/var/www/stelfox.net/root/
