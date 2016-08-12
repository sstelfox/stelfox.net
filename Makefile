all: dev

dev:
	hugo --buildDrafts --buildExpired --buildFuture

prod:
	hugo

server:
	hugo server --buildDrafts --buildExpired --buildFuture --watch
