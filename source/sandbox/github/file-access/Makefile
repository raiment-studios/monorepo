
# MY_GITHUB_TOKEN needs to be set to a Personal Access Token with full repo permissions

PHONY: run-get
run-get:
	curl -v  \
		-H "Authorization: token $(MY_GITHUB_TOKEN)" \
		https://api.github.com/repos/raiment-studios/raiment-studios.github.io/contents/index.html


PHONY: run-set
run-set:
	echo "$(shell base64 -w 0 hello.html)"
	sed 's/DATENOW/$(shell date)/' < hello.template.html > hello.html
	curl -v \
		-X PUT \
		-H "Authorization: token $(MY_GITHUB_TOKEN)" \
		https://api.github.com/repos/raiment-studios/raiment-studios.github.io/contents/hello.html \
   		 -d '{"message":"test automated commit $(shell date)","committer":{"name":"Auto Mation","email":"noreply@example.com"},"content":"$(shell base64 -w 0 hello.html)","sha":$(shell curl -H "Authorization: token $(MY_GITHUB_TOKEN)" https://api.github.com/repos/raiment-studios/raiment-studios.github.io/contents/hello.html | jq '.sha')}'