pushd secrets
git clone https://$GITHUB_TOKEN@github.com/raiment-studios/raiment-secrets-deployment.git deployment
cd deployment && git pull
popd