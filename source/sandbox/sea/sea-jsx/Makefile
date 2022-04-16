run:
	node . examples/001-hello-world/hello-world.js

publish:
	-sudo npm uninstall --global @raiment/sea-jsx
	npm version patch
	sudo npm install --global .
	git pull
	cd ${MONOREPO_ROOT} && git add .
	cd ${MONOREPO_ROOT} && git commit -m "Publish sea-jsx"
	git push
