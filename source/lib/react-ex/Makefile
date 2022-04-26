
build: build-pack
build-pack:
	mkdir -p dist 
	cd dist && npm pack ..
	rm -f dist/*-latest.tgz
	@$(MAKE) --no-print-directory build-update-latest
build-update-latest:
	cp -f dist/$(shell ls -r dist | head -n 1) dist/$(shell ls -r dist | head -n 1 | sed -r 's/[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+/latest/')

publish:
	@git diff --quiet || git status && echo "\nERROR: Repository is dirty. Canceling publish." && false
	git pull
	@git diff --quiet || git status && echo "\nERROR: Repository is dirty. Canceling publish." && false
	npm version patch
	git add package.json
	git commit -m "Update package.json for publish"
	git push
	npm publish
	