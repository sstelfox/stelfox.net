build: logo setup
	@podman run --rm --security-opt label=disable -e NO_COLOR=true \
		-v $$(pwd):/app -w /app docker.io/balthek/zola:0.14.0 build

check:
	@podman run --rm --security-opt label=disable -e NO_COLOR=true \
		-v $$(pwd):/app -w /app docker.io/balthek/zola:0.14.0 check

logo: static/apple-touch-icon.png static/favicon.ico static/logo.png

serve:
	@podman run --rm --security-opt label=disable -e NO_COLOR=true -p 8080:8080 \
		-p 1024:1024 -v $$(pwd):/app -w /app docker.io/balthek/zola:0.14.0 serve \
		--interface 0.0.0.0 --port 8080 --base-url 127.0.0.1

setup:
	@git submodule init
	@git submodule sync
	@git submodule update --remote

static/apple-touch-icon.png: logo_src/stelfox_favicon.svg Makefile
	convert -scale 60x60 logo_src/stelfox_favicon.svg static/apple-touch-icon.png

static/favicon.ico: logo_src/stelfox_favicon.svg Makefile
	convert -scale 16x16 logo_src/stelfox_favicon.svg static/favicon.ico

static/logo.png: logo_src/stelfox_clean_icon.svg Makefile
	convert -alpha on -quality 85 -scale 192x192 -transparent white logo_src/stelfox_clean_icon.svg static/logo.png

.PHONY: build check logo serve setup
.DEFAULT_GOAL := build
