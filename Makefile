build:
	rm -rf public/*
	@hugo --environment production --logLevel info --minify --printI18nWarnings --printPathWarnings

clean:
	@rm -rf public/*

logo: static/favicon.ico static/favicon-32x32.png static/apple-touch-icon.png static/logo.png

preview:
	hugo server --baseURL http://127.0.0.1:8000 --environment production --port 8000 --logLevel info --printI18nWarnings --printPathWarnings --disableFastRender --disableLiveReload

server:
	hugo server --baseURL http://127.0.0.1:8000 --environment development --port 8000 --logLevel info --buildDrafts --buildExpired --buildFuture --printI18nWarnings --printPathWarnings --disableFastRender --disableLiveReload

setup:
	git submodule init
	git submodule update
	git submodule sync

static/favicon.ico: logo_src/stelfox_favicon.svg
	convert -scale 16x16 logo_src/stelfox_favicon.svg static/favicon.ico

static/favicon-32x32.png: logo_src/stelfox_favicon.svg
	convert -scale 32x32 logo_src/stelfox_favicon.svg static/favicon-32x32.png

static/apple-touch-icon.png: logo_src/stelfox_favicon.svg
	convert -scale 60x60 logo_src/stelfox_favicon.svg static/apple-touch-icon.png

static/logo.png: logo_src/stelfox_clean_icon.svg
	convert -alpha on -quality 85 -scale 192x192 -transparent white logo_src/stelfox_clean_icon.svg static/logo.png

.PHONY: build clean logo server
.DEFAULT_GOAL := build
