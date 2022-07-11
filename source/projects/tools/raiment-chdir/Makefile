###############################################################################
# ensure
###############################################################################

.PHONY: ensure

# Use a sentinel file to avoid invoking npm if not needead as npm install can
# be slow
ensure:
	cmp --silent node_modules/package.sentinel package.json || npm install
	cp package.json node_modules/package.sentinel


publish-local: ensure
	sudo npm install --global .
