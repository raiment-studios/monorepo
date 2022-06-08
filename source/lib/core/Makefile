
###############################################################################
# ensure
###############################################################################

# Use a sentinel file to avoid invoking npm if not needead as npm install can
# be slow

.PHONY: ensure
ensure:
	cmp --silent node_modules/package.sentinel package.json || npm install
	cp package.json node_modules/package.sentinel
	@echo "Workaround for Jest and fast-mersenne-twister..."
	sed -i \
		's/export function MersenneTwister/module.exports.MersenneTwister = function MersenneTwister/' \
		node_modules/fast-mersenne-twister/mersenne.js

###############################################################################
# build
###############################################################################

build: ensure build-pack

build-pack:
	mkdir -p dist
	cd dist && npm pack ..
	rm -f dist/*-latest.tgz
	@$(MAKE) --no-print-directory build-update-latest
build-update-latest:
	cp -f dist/$(shell ls -r dist | head -n 1) dist/$(shell ls -r dist | head -n 1 | sed -r 's/[[:digit:]]+\.[[:digit:]]+\.[[:digit:]]+/latest/')


###############################################################################
# test
###############################################################################

test: ensure
	npx sea-jest src

###############################################################################
# publish
###############################################################################

publish: ensure build test
	@git diff --quiet || (git status && echo "\nERROR: Repository is dirty. Canceling publish." && false)
	git pull
	@git diff --quiet || (git status && echo "\nERROR: Repository is dirty. Canceling publish." && false)
	npm version patch
	git add package.json
	git commit -m "Update package.json for publish"
	git push
	npm publish