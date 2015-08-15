_sierra-charlie_
================

TODO


Usage
-----

Install dependencies:

```
brew install advancecomp node s3cmd
npm install
```


### Development

Start local server:

```
npm start
```


### Deployment

Build bundle:

```
npm run build
```

Upload to Amazon S3:

```
s3cmd put src/index.html dist/bundle.js \
    s3://sierracharlie.mietek.io \
    --acl-public --no-preserve
```


#### Deployment of data files

Compress data files:

```
for i in json/*.json; do
    echo $i
    gzip --fast --keep $i
    advdef --iter 100 --shrink-insane --quiet -z $i.gz
done
```

Upload to Amazon S3:

```
s3cmd sync json \
    s3://sierracharlie.mietek.io \
    --acl-public --no-preserve \
    --exclude='*' --include='*.json.gz' \
    --add-header="Cache-Control:max-age=3600" \
    --add-header='Content-Type:application/json' \
    --add-header='Content-Encoding:gzip'
```


About
-----

Made by [Miëtek Bak](https://mietek.io).  Published under the [MIT X11 license](LICENSE.md).
