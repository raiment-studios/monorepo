DEVELOPMENT_MODE ?= 0
BUILD_FLAGS ?=

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
	make -C ../core build-pack
	make -C ../react-ex build-pack
	npm i

#
# build
#


ifeq ($(DEVELOPMENT_MODE),1)
BUILD_FLAGS += --define:DEVELOPMENT_MODE=1 
else
BUILD_FLAGS += --define:DEVELOPMENT_MODE=0 --minify
endif

.PHONY: build
build:
	mkdir -p dist	
	node ./src/scripts/transform_assets.js
	node -e "console.log(Date.now());" > dist/buildstamp.txt
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
	npx concurrently "make run" "make dev-watch" "make dev-watch-react-ex" "make dev-watch-core"
dev-watch:
	npx nodemon -q \
		--ext js,yaml,yml,jsx,json \
		--watch "src/**/*" \
		--exec "DEVELOPMENT_MODE=1 make build"

dev-watch-react-ex:
	npx nodemon -q \
		--watch "$(MONOREPO_ROOT)/source/projects/react-ex/src/**/*" \
		--exec "make -C ../react-ex build-pack && npm i @raiment/react-ex && DEVELOPMENT_MODE=1 make build"

dev-watch-core:
	npx nodemon -q \
		--watch "$(MONOREPO_ROOT)/source/projects/core/src/**/*" \
		--exec "make -C ../core build-pack && npm i @raiment/core && DEVELOPMENT_MODE=1 make build"

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

