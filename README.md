```
brew install node
npm install
npm run build
```

```
s3cmd put index.html dist/bundle.js s3://sierracharlie.mietek.io --acl-public --no-preserve
```

```
for i in *.json; do echo $i; gzip --fast --keep $i; advdef --iter 100 --shrink-insane --quiet -z ${i}.gz; done
```

```
s3cmd sync . s3://sierracharlie.mietek.io/json/ --acl-public --no-preserve --exclude='*' --include='*.json.gz' --add-header='Content-Type:application/json' --add-header='Content-Encoding:gzip'
```

```
s3cmd sync . s3://sierracharlie.mietek.io/json/ --acl-public --no-preserve --exclude='*' --include='*.json' --add-header='Content-Type:application/json'
```

```
npm run clean
```
