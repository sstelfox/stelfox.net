build: related
	rm -rf public/*
	@hugo --environment production --logLevel info --minify --printI18nWarnings --printPathWarnings

clean:
	@rm -rf public/*

logo: static/favicon.ico static/favicon-32x32.png static/apple-touch-icon.png static/logo.png

preview:
	hugo server --bind 0.0.0.0 --baseURL http://0.0.0.0:8000 --environment production --port 8000 --logLevel info --printI18nWarnings --printPathWarnings --disableFastRender --disableLiveReload

server: related
	hugo server --bind 0.0.0.0 --baseURL http://0.0.0.0:8000 --environment development --port 8000 --logLevel info --buildDrafts --buildExpired --buildFuture --printI18nWarnings --printPathWarnings --disableFastRender --disableLiveReload

# Build search index (now handled automatically by Hugo)
search:
	@if [ ! -f public/search_index.json ]; then \
		echo "search index not found. run 'make related' first."; \
		exit 1 \
	fi

related:
	@echo "Generating related content data..."
	@./bin/generate_related.py
	@echo "Done. Related content written to data/related.json"

.PHONY: build clean logo related search server
.DEFAULT_GOAL := build
