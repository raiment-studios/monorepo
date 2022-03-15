DEVELOPMENT_MODE ?= 0

#
# clean
#

.PHONY: clean
clean:
	echo "TODO"


#
# build
#

BUILD_FLAGS ?=

ifeq ($(DEVELOPMENT_MODE),1)
BUILD_FLAGS += --define:DEVELOPMENT_MODE=1 
else
BUILD_FLAGS += --minify
endif

.PHONY: build
build:
	echo "$(BUILD_FLAGS)"
	mkdir -p dist	
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
	npx http-server -c0 dist

#
# dev
#

.PHONY: dev dev-watch
dev:
	npx concurrently "make run" "make dev-watch" "make dev-watch-react-ex"
dev-watch:
	npx nodemon -q \
		--watch "src/**/*" \
		--exec "DEVELOPMENT_MODE=1 make build"
dev-watch-react-ex:
	npx nodemon -q \
		--watch "$(MONOREPO_ROOT)/source/projects/react-ex/src/**/*" \
		-
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

