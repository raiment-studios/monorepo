#
#
# sea-jsx
#
#

###############################################################################
# default
###############################################################################

.PHONY: default

default:
	echo "No default target"

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
# clean
############################################################################### 

.PHONY: clean
clean:
	git clean -dfX

###############################################################################
# build
############################################################################### 

.PHONY: build 

# build currently requires no steps
build: ensure

############################################################################### 
# dev
###############################################################################

.PHONY: dev
dev: build
	echo "TODO"a

############################################################################### 
# run
###############################################################################
.PHONY: run
run: build
	node . examples/001-hello-world/hello-world.js

############################################################################### 
# test
###############################################################################

.PHONY: test
test: build
	npx sea-jest --verbose .

###############################################################################
# benchmark
############################################################################### 
.PHONY: benchmark
benchmark:
	echo "TODO"

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
	-sudo npm uninstall --global @raiment/sea-jsx
	sudo npm install --global .
