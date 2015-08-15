_sierra-charlie_
================

TODO


### Instructions

Install dependencies:

```
npm install
```

Start local development server:

```
npm start
```

Build production bundle:

```
npm run build
```

Deploy to remote production server:

```
s3cmd put src/index.html dist/bundle.js \
    s3://sierracharlie.mietek.io \
    --acl-public --no-preserve
```


#### Compressed data files

Install dependencies:

```
brew install advancecomp
```

Compress data files:

```
for i in json/*.json; do
    echo $i
    gzip --fast --keep $i
    advdef --iter 100 --shrink-insane --quiet -z $i.gz
done
```

Upload compressed data files:

```
s3cmd sync json \
    s3://sierracharlie.mietek.io/json/ \
    --acl-public --no-preserve \
    --exclude='*' --include='*.json.gz' \
    --add-header='Content-Type:application/json' \
    --add-header='Content-Encoding:gzip'
```


About
-----

Made by [Miëtek Bak](https://mietek.io).  Published under the [MIT X11 license](LICENSE.md).
