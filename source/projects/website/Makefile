dev:
	npx http-server dist -c-1 -d -i -e html --cors 

publish:
	git clone https://${RAIMENT_GITHUB_PERSONAL_ACCESS_TOKEN}:x-oauth-basic@github.com/raiment-studios/raiment-studios.github.io.git dest || \
		cd dest && \
			git config pull.rebase false && \
			git pull https://${RAIMENT_GITHUB_PERSONAL_ACCESS_TOKEN}:x-oauth-basic@github.com/raiment-studios/raiment-studios.github.io.git
	cp -R dest/.git dist/.git
	-cd dist && git status && git add . && git commit -m "Update for publish"
	-cd dist && git push 
	cd dist && rm -rf .gita