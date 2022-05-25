clean:
	rm -rf dest
	rm -rf dist

dev: build
	npx http-server dist -c-1 -d -i -e html --cors 

build:
	node src/build.js
	sea-jsx build src/index.js --target=dist/index.html

publish: build
	mkdir -p dist
	-git clone https://${RAIMENT_GITHUB_PERSONAL_ACCESS_TOKEN}:x-oauth-basic@github.com/raiment-studios/raiment-studios.github.io.git dest
	-cd dest && git config pull.rebase false && git pull https://${RAIMENT_GITHUB_PERSONAL_ACCESS_TOKEN}:x-oauth-basic@github.com/raiment-studios/raiment-studios.github.io.git
	rm -rf dist/.git
	cp -R dest/.git dist/.git
	-cd dist && git status && git add . && git commit -m "Update for publish"
	-cd dist && git push 
	cd dist && rm -rf .git
	@echo "https://raiment-studios.github.io/"