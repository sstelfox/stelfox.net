default: build

build: related
    rm -rf public/*
    hugo --environment production --logLevel info --minify --printI18nWarnings --printPathWarnings
    just check-tags

preview port="8000": related
    hugo server --bind 0.0.0.0 --baseURL http://0.0.0.0:{{port}} --environment production --port {{port}} --logLevel info --printI18nWarnings --printPathWarnings --disableFastRender --disableLiveReload

server port="8000":
    hugo server --bind 0.0.0.0 --baseURL http://0.0.0.0:{{port}} --environment development --port {{port}} --logLevel info --buildDrafts --buildExpired --buildFuture --printI18nWarnings --printPathWarnings --disableFastRender --disableLiveReload

related:
    ./bin/generate_related.py

check-tags:
    python3 ./bin/check_tags.py

deploy: build e2e
    rsync -rczi --delete --cvs-exclude --include='tags/' --include='tags/**' public/ singing-evening-road.stelfox.net:/var/www/stelfox.net/root/

e2e:
    cd playwright && npx playwright test
