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

DIR_LIB = $(MONOREPO_ROOT)/source/lib

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
	make -C $(DIR_LIB)/core build
	make -C $(DIR_LIB)/react-ex build
	npm i
ensure-deps:
	make -C $(DIR_LIB)/core build
	make -C $(DIR_LIB)/react-ex build
	npm uninstall @raiment/core
	npm uninstall @raiment/react-ex
	npm install --save file://$(DIR_LIB)/core/dist/raiment-core-latest.tgz		
	npm install --save file://$(DIR_LIB)/react-ex/dist/raiment-react-ex-latest.tgz	


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
		--watch ""$(DIR_LIB)/react-ex/src/**/*" \
		--exec "make -C $(DIR_LIB)/react-ex build-pack && npm i @raiment/react-ex && DEVELOPMENT_MODE=1 make build"

dev-watch-core:
	npx nodemon -q \
		--watch "$(DIR_LIB)/core/src/**/*" \
		--exec "make -C $(DIR_LIB)/core build-pack && npm i @raiment/core && DEVELOPMENT_MODE=1 make build"

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
	npx firebase deploy --token $(FIREBASE_TOKEN)

