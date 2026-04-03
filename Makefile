build:
	rm -rf public/*
	@hugo --environment production --logLevel info --minify --printI18nWarnings --printPathWarnings
	@if command -v pagefind > /dev/null 2>&1; then \
		pagefind --site public --output-subdir pagefind; \
	else \
		echo "Warning: pagefind not found. Search will not be available."; \
		echo "Install with: cargo install pagefind"; \
	fi

clean:
	@rm -rf public/*

logo: static/favicon.ico static/favicon-32x32.png static/apple-touch-icon.png static/logo.png

preview:
	hugo server --bind 0.0.0.0 --baseURL http://0.0.0.0:8000 --environment production --port 8000 --logLevel info --printI18nWarnings --printPathWarnings --disableFastRender --disableLiveReload

server:
	hugo server --bind 0.0.0.0 --baseURL http://0.0.0.0:8000 --environment development --port 8000 --logLevel info --buildDrafts --buildExpired --buildFuture --printI18nWarnings --printPathWarnings --disableFastRender --disableLiveReload

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

# Build search index (run after build)
search:
	@if command -v pagefind > /dev/null 2>&1; then \
		pagefind --site public --output-subdir pagefind; \
	else \
		echo "Error: pagefind not found."; \
		echo "Install with: cargo install pagefind"; \
		exit 1; \
	fi

# Build Tailwind CSS (only run when styles change)
# Generated CSS is committed to git, so this is not needed for regular builds
styles:
	@if command -v npx > /dev/null 2>&1; then \
		cd themes/stelfox-dark && \
		npx tailwindcss -c tailwind.config.mjs -i src/css/tailwind-source.css -o static/css/style-tailwind.css --minify && \
		echo "Tailwind CSS built successfully. Don't forget to commit the changes!"; \
	else \
		echo "Error: npx not found (Node.js required for Tailwind build)"; \
		echo "Install Node.js or use the pre-built CSS"; \
		exit 1; \
	fi

.PHONY: build clean logo search server styles
.DEFAULT_GOAL := build
