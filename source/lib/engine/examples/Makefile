
define publish_example
	sea-jsx $(1)/index.js \
		--publish \
		--target=raiment-studios.github.io/engine/examples/$(1).html \
		--token=$(RAIMENT_GITHUB_PERSONAL_ACCESS_TOKEN)
endef

publish:
	$(call publish_example,01-frame-loop)
	$(call publish_example,02-bounce)
	$(call publish_example,03-state-machine)
	$(call publish_example,04-engine-frame)
	$(call publish_example,05-engine-three)
	$(call publish_example,06-engine-lighting)