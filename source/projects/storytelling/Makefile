DEVELOPMENT_MODE ?= 0

.PHONY: clean
clean:
	echo "TODO"

.PHONY: build
build:
	mkdir -p dist	
	node -e "console.log(Date.now());" > dist/buildstamp.txt
	cp -f src/*.html dist/
	npx esbuild \
		--define:DEVELOPMENT_MODE=$(DEVELOPMENT_MODE) \
		--loader:.js=jsx \
		--outfile=dist/client.js \
		--sourcemap=inline \
		--bundle src/client.js

.PHONY: run
run:
	npx http-server -c0 dist

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
		--exec "make -C ../react-ex build-pack && npm i @raiment/react-ex && DEVELOPMENT_MODE=1 make build"

.PHONY: test
test:
	echo "TODO"

.PHONY: publish
publish: build
	npx firebase deploy

