build:
	hugo

depends:
	go get -u -v github.com/gohugoio/hugo

server:
	hugo server --log --verbose --verboseLog --i18n-warnings --enableGitInfo --buildDrafts --buildFuture

.PHONY: build depends server
.DEFAULT_GOAL := server

# vim: set ts=2 sw=2 noexpandtab ai :
