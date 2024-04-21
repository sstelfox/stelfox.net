# Note to self: buildFuture is included as hugo appears to have issues with timezones
build:
	@hugo --baseURL https://stelfox.net/ --logLevel info --buildFuture --printI18nWarnings --printPathWarnings --printUnusedTemplates

clean:
	@rm -rf public/*

logo: static/favicon.ico static/apple-touch-icon.png static/logo.png

server:
	hugo server --port 8080 --logLevel info --buildDrafts --buildExpired --buildFuture --printI18nWarnings --printPathWarnings --printUnusedTemplates

static/favicon.ico: logo_src/stelfox_favicon.svg Makefile
	convert -scale 16x16 logo_src/stelfox_favicon.svg static/favicon.ico

static/apple-touch-icon.png: logo_src/stelfox_favicon.svg Makefile
	convert -scale 60x60 logo_src/stelfox_favicon.svg static/apple-touch-icon.png

static/logo.png: logo_src/stelfox_clean_icon.svg Makefile
	convert -alpha on -quality 85 -scale 192x192 -transparent white logo_src/stelfox_clean_icon.svg static/logo.png

.PHONY: build clean depends logo server
.DEFAULT_GOAL := build

# vim: set ts=2 sw=2 noexpandtab ai :
