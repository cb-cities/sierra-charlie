_sierra-charlie_
================

TODO


Online use
----------

To use the project, navigate to the following address in a web browser:

[http://sierracharlie.mietek.io/](http://sierracharlie.mietek.io/)


Offline use
-----------

Using the project without an Internet connection requires building the project on a local machine.

Start by downloading the project source and data files:

```
git clone https://github.com/mietek/sierra-charlie
cd sierra-charlie
```


### Installing dependencies

Portions of the code are written in [PureScript](http://www.purescript.org/) and [Elm](http://elm-lang.org/).  Compilers for both languages and the [Node.js](https://nodejs.org/) runtime must be installed on the local machine.

The project is developed on OS X, but may support other UNIX platforms.  On OS X, system-level dependencies should be installed with the [`brew`](http://brew.sh/) tool.

```
brew install node purescript elm
```

Use the [`npm`](https://www.npmjs.com/) tool, which is included with Node.js, to install project-level dependencies:

```
npm install
```


### Building the project

To build the project, give the following command:

```
npm run build
```

If the build is successful, the project is ready to run.  Start a local HTTP server:

```
npm start
```

Finally, navigate to the following address in a web browser:

[http://localhost:3000/](http://localhost:3000/)


Development
-----------

By default, the project is built in production mode, performing potentially time-consuming code optimisations.  This is unnecessary during development, and can be avoided by giving the following command:

```
npm run dev-build
```


### Building continuously

For additional convenience, the source files of  project may be continuously monitored for changes by the local machine.  Changing any of the files will cause a build to be performed automatically.

If the build is successful, any project-related web browser windows will be automatically reloaded.  This is supported on OS X only, in Chrome, Firefox, and Safari, and requires installing the [`entr`](http://entrproject.org/) tool.  (See [_reload-firefox_](https://github.com/mietek/reload-firefox) for Firefox-specific instructions.)

```
brew install entr
```

To start monitoring the project for changes, give the following command:

```
bin/start
```

By default, continuous builds are performed in development mode.  This may be changed by pointing the `CONFIG` environment variable to the production configuration file:

```
CONFIG=webpack.config.js bin/start
```


### Compressing data

The data used by the project is kept in Gzip-compressed [JSON](http://json.org/) files.  If any changes to the data are required, the [`pigz`](http://zlib.net/pigz/) tool may be used to recompress the resulting files.

```
brew install pigz
```

During development, the data may be compressed with the default settings:

```
pigz json/*.json
```

For production use, the data should be compressed with the Zopfli algorithm, which offers a superior compression ratio, at a cost of significant processing time.  This may be selected with the `-11` parameter.  _([“These go to eleven.”](https://youtube.com/watch?v=4xgx4k83zzc))_

```
pigz -11 json/*.json
```


### Uploading the project

The online version of the project is hosted on [Amazon S3](https://aws.amazon.com/s3/).  Given the right security credentials, the data files may be uploaded to S3 with the [`s3cmd`](http://s3tools.org/s3cmd/) tool.

```
brew install s3cmd
```

Any uploaded code should be built in production mode.  To upload the most recently built version of the code, replacing any previously uploaded version, give the following command:

```
npm run upload
```

A separate command may be given to upload the data.

```
npm run upload-data
```


About
-----

Made by [Miëtek Bak](https://mietek.io/).  Published under the [MIT X11 license](LICENSE.md).
