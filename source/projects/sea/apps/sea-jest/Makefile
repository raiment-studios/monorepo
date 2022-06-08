.PHONY: ensure
ensure:
	cmp --silent node_modules/package.sentinel package.json || npm install
	cp package.json node_modules/package.sentinel

build: ensure
	echo "TODO"

dev: ensure
	npx nodemon --watch "src/**/*" --exec make run

run: ensure
	node . 

test: ensure
	npx jest --verbose .

benchmark: ensure
	echo "TODO"

publish-local: ensure
	-sudo npm uninstall --global @raiment/sea-jest
	sudo npm install --global .

publish:
	npm publish --access public