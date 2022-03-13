pushd secrets
git clone https://$GITHUB_TOKEN@github.com/raiment-studios/raiment-secrets-deployment.git deployment
cd deployment && git config pull.rebase false && git pull
popd