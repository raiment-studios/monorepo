build:
	mkdir -p dist
	cp -f src/*.html dist/
	npx esbuild \
		--loader:.js=jsx \
		--outfile=dist/client.js \
		--sourcemap=inline \
		--bundle src/client.js

publish:
	npx firebase deploy