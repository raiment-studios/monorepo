###############################################################################
# ensure
###############################################################################

.PHONY: ensure

# Use a sentinel file to avoid invoking npm if not needead as npm install can
# be slow
ensure:
	cmp --silent node_modules/package.sentinel package.json || npm install
	cp package.json node_modules/package.sentinel


############################################################################### 
# publish
###############################################################################
.PHONY: publish publish-local

publish: ensure
	@git diff --quiet || (git status && echo "\nERROR: Repository is dirty. Canceling publish." && false)
	git pull
	@git diff --quiet || (git status && echo "\nERROR: Repository is dirty. Canceling publish." && false)
	npm version patch
	git add package.json
	git commit -m "Update package.json for publish"
	git push
	npm publish --access=public

publish-local: ensure
	sudo npm install --global .
