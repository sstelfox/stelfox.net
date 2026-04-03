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

# Build the site
make build

# Deploy the new changes to server
rsync -rczi --delete --cvs-exclude --exclude search_index.json public/ singing-evening-road.stelfox.net:/var/www/stelfox.net/root/
