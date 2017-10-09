build:
	hugo

server:
	hugo server --log --verbose --verboseLog --i18n-warnings --enableGitInfo --buildDrafts --buildFuture

.PHONY: build server
.DEFAULT_GOAL := server
