default: build

build: related
    rm -rf public/*
    hugo --environment production --logLevel info --minify --printI18nWarnings --printPathWarnings

clean:
    rm -rf public/*

preview:
    hugo server --bind 0.0.0.0 --baseURL http://0.0.0.0:8000 --environment production --port 8000 --logLevel info --printI18nWarnings --printPathWarnings --disableFastRender --disableLiveReload

server: related
    hugo server --bind 0.0.0.0 --baseURL http://0.0.0.0:8000 --environment development --port 8000 --logLevel info --buildDrafts --buildExpired --buildFuture --printI18nWarnings --printPathWarnings --disableFastRender --disableLiveReload

related:
    ./bin/generate_related.py

deploy: build
    rsync -rczi --delete --cvs-exclude public/ singing-evening-road.stelfox.net:/var/www/stelfox.net/root/
