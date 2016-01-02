_sierra-charlie_
================

TODO


Online use
----------

You may use the project by navigating to the following address in your web browser:

[http://sierracharlie.mietek.io/](http://sierracharlie.mietek.io/)


Offline use
-----------

To use the project without an Internet connection, you should build it on your local machine.  First, clone the project repository:

```
git clone https://github.com/mietek/sierra-charlie
```

The following instructions assume the project directory is the current working directory.

```
cd sierra-charlie
```


### Installing dependencies

Building the project requires installing the [Node.js](https://nodejs.org/) runtime, the [PureScript](http://www.purescript.org/) compiler, and the [Elm](http://elm-lang.org/) compiler.

The project is developed on OS X, but may support other Unix-like platforms.  On OS X, dependencies should be installed with [Homebrew](http://brew.sh/).

```
brew install node purescript elm
```

The [`npm`](https://www.npmjs.com/) tool, part of Node.js, is used to automate the build process.  Continue by installing the project-specific dependencies:

```
npm install
```


### Building the project

Building the project in production mode performs all code optimisations:

```
npm run build
```


### Running the project

You are now ready to run the project.  Start a local HTTP server using the following command:

```
npm start
```

Finally, navigate to the following address in your web browser:

[http://localhost:3000/](http://localhost:3000/)


Development
-----------

The project may also be built without performing time-consuming code optimisations.  This is convenient during development.

```
npm run dev-build
```


### Building continuously

For additional convenience, the project may be automatically rebuilt following any change to its source files.  If the build is successful, any project-related web browser windows will automatically reload, in Chrome, Firefox, and Safari.  This is supported on OS X only, and requires installing the [`entr`](http://entrproject.org/) tool.

```
brew install entr
```

To start monitoring the project for changes, run the following command:

```
bin/start
```

_Note:_ By default, continuous builds are performed in development mode.  This may be changed by pointing the `CONFIG` environment variable to the production configuration file:

```
CONFIG=webpack.config.js bin/start
```


### Compressing the data

The data used by the project is kept in Gzip-compressed [JSON](http://json.org/) files.  If any changes to the data are required, the [`pigz`](http://zlib.net/pigz/) tool may be used to recompress the files.

```
brew install pigz
```

During development, the data may be compressed with the default settings:

```
pigz json/*.json
```

For production use, the data should be compressed using the Zopfli algorithm, which offers a superior compression ratio, at a cost of significant processing time.  This may be selected with the `-11` parameter.  _([“These go to eleven.”](https://youtube.com/watch?v=4xgx4k83zzc))_

```
pigz -11 json/*.json
```


### Uploading the project

The online version of the project is hosted on [Amazon S3](https://aws.amazon.com/s3/).  Files may be uploaded to S3 using the [`s3cmd`](http://s3tools.org/s3cmd/) tool.

```
brew install s3cmd
```

To upload the most recently built version of the code, replacing any previously uploaded version, run the following command:

```
npm run upload
```

A separate command may be used to upload the data, if necessary.

```
npm run upload-data
```

_Note:_ Any uploaded code should be built in production mode.


About
-----

Made by [Miëtek Bak](https://mietek.io/).  Published under the [MIT X11 license](LICENSE.md).
