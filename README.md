_sierra-charlie_
================

TODO


Usage
-----

Install dependencies:

```
brew install node pigz s3cmd
npm install
```

Compress data files: (3 minutes)

```
pigz -11 --keep json/*.json
```


### Development

Build and start local server:

```
npm run build
npm start
```


### Production

Build and start local server:

```
npm run build.prod
npm start
```

Upload to Amazon S3:

```
s3cmd put dist/index.appcache dist/index.html dist/index.js \
    s3://sierracharlie.mietek.io \
    --acl-public
s3cmd sync json \
    s3://sierracharlie.mietek.io \
    --acl-public \
    --delete-removed \
    --exclude='*' \
    --include='*.json.gz' \
    --add-header='Cache-Control:max-age=3600' \
    --add-header='Content-Type:application/json' \
    --add-header='Content-Encoding:gzip'
```


About
-----

Made by [Miëtek Bak](https://mietek.io/).  Published under the [MIT X11 license](LICENSE.md).
