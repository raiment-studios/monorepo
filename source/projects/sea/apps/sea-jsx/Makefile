ensure:
	echo "TODO"

build:
	echo "TODO"

dev:
	echo "TODO"

run:
	node . examples/001-hello-world/hello-world.js

test:
	npx sea-jest --verbose .

benchmark:
	echo "TODO"

publish-local:
	-sudo npm uninstall --global @raiment/sea-jsx
	sudo npm install --global .

publish:
	@git diff --quiet || (git status && echo "\nERROR: Repository is dirty. Canceling publish." && false)
	git pull
	@git diff --quiet || (git status && echo "\nERROR: Repository is dirty. Canceling publish." && false)
	npm version patch
	git add package.json
	git commit -m "Update package.json for publish"
	git push
	npm publish
