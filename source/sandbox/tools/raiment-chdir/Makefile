

ensure:
	rm -rf node_modules/@raiment
	npm uninstall @raiment/core
	npm cache clean --force
	npm i --save file://$(MONOREPO_ROOT)/source/lib/core/dist/raiment-core-latest.tgz


publish:
	sudo npm install --global .
