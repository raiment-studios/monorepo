run:
	node . examples/001-hello-world/hello-world.js

publish-force:
	-sudo npm uninstall --global @raiment/sea-jsx
	npm version patch
	sudo npm install --global .

publish:
	sudo npm install --global .