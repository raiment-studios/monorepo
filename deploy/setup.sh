#!/usr/bin/env bash

#
# The personal access token is the "root" key for the user.  This key in turn should
# have access to other private repositories that contain other keys. 
#
# If a user should no longer have rights to a permissions group:
# (1) Remove them from the private repo containing those keys
# (2) Renew all the keys in that repo
#
# If a user should be given access to a permissions group:
# (1) Ensure their user has access to that private repository
#
if [[ -z "${RAIMENT_GITHUB_PERSONAL_ACCESS_TOKEN}" ]]; then
    echo
    echo
    echo "--------------------------------------------------------------------------"
    echo "WARNING"
    echo "--------------------------------------------------------------------------"
    echo
    echo "RAIMENT_GITHUB_PERSONAL_ACCESS_TOKEN is not set."
    echo "This should be access token with repository access."
    echo "Set this variable in your codespace secrets or local environment."
    echo
    echo "--------------------------------------------------------------------------"
    echo
    echo
    return;
fi

pushd ${MONOREPO_ROOT}/deploy/secrets

# Currently the only permissions group is "admin"
if [[ -f "secrets-admin/setup.sh" ]]; then
    pushd secrets-admin 
    git config pull.rebase false
    git pull https://${RAIMENT_GITHUB_PERSONAL_ACCESS_TOKEN}:x-oauth-basic@github.com/raiment-studios/secrets-admin.git
    popd 
else
    git clone https://${RAIMENT_GITHUB_PERSONAL_ACCESS_TOKEN}:x-oauth-basic@github.com/raiment-studios/secrets-admin.git secrets-admin
fi
if [[ -f "secrets-admin/setup.sh" ]]; then
    source secrets-admin/setup.sh
fi


popd
