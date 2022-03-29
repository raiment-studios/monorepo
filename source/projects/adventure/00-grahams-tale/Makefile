###############################################################################
# Variables
###############################################################################

DEVELOPMENT_MODE ?= 0
BUILD_FLAGS ?=

ifeq ($(DEVELOPMENT_MODE),1)
BUILD_FLAGS += --define:DEVELOPMENT_MODE=1 
else
BUILD_FLAGS += --define:DEVELOPMENT_MODE=0 --minify
endif

LIB_DIR = $(MONOREPO_ROOT)/source/projects

###############################################################################
# Targets
###############################################################################

#
# clean
#

.PHONY: clean
clean:
	git clean -dfX

#
# ensure
#
.PHONY: ensure
ensure:
	make -C $(LIB_DIR)/core build-pack
	make -C $(LIB_DIR)/react-ex build-pack
	npm i
ensure-deps:
	npm cache clean --force
	make -C $(LIB_DIR)/core build-pack
	npm install @raiment/core
	make -C $(LIB_DIR)/react-ex build-pack
	npm install @raiment/react-ex


#
# build
#
.PHONY: build
build:
	mkdir -p dist	
	node -e "console.log(Date.now());" > dist/buildstamp.txt
	node ./scripts/transform_assets.js
	cp -f src/*.html dist/
	npx esbuild \
		$(BUILD_FLAGS) \
		--loader:.js=jsx \
		--outfile=dist/client.js \
		--sourcemap=linked \
		--bundle src/client.js

#
# run
#
.PHONY: run
run:
	npx http-server -c0 dist --silent

#
# dev
#

.PHONY: dev dev-watch
dev: ensure
	npx concurrently \
		"make run" \
		"make dev-watch" \
		"make dev-watch-assets" \
		"make dev-watch-react-ex" \
		"make dev-watch-core"

dev-watch:
	npx nodemon -q \
		--ext js,yaml,yml,jsx,json \
		--watch "src/**/*" \
		--exec "DEVELOPMENT_MODE=1 make build"

dev-watch-assets:
	npx nodemon -q \
		--ext png,jpg,js,yaml,yml,jsx,json \
		--watch "assets/**/*" \
		--exec "DEVELOPMENT_MODE=1 make build"

dev-watch-react-ex:
	npx nodemon -q \
		--watch ""$(LIB_DIR)/react-ex/src/**/*" \
		--exec "make -C $(LIB_DIR)/react-ex build-pack && npm i @raiment/react-ex && DEVELOPMENT_MODE=1 make build"

dev-watch-core:
	npx nodemon -q \
		--watch "$(LIB_DIR)/core/src/**/*" \
		--exec "make -C $(LIB_DIR)/core build-pack && npm i @raiment/core && DEVELOPMENT_MODE=1 make build"

#
# test
#

.PHONY: test
test:
	echo "TODO"

#
# publish
#

.PHONY: publish
publish: build
	npx firebase deploy

