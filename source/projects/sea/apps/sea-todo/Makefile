ensure:
	echo "TODO"

build:
	npx sea-jsx --build src/main.js

dev:
	npx sea-jsx src/main.js

run:
	node . 

test:
	npx sea-jest --verbose .

benchmark:
	echo "TODO"

publish: build
	npx firebase deploy --only hosting:sea-todo --token $(FIREBASE_TOKEN)
