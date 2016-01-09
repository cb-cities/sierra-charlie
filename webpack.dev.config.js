"use strict";

var webpack = require("webpack");


module.exports = {
  context: __dirname + "/src",

  devtool: "eval",

  entry: "./index.js",

  output: {
    path: __dirname + "/out",
    filename: "index.js",
    publicPath: "/"
  },

  resolve: {
    modulesDirectories: [
      "node_modules",
      "bower_components/purescript-prelude/src"
    ],
    extensions: ["", ".js", ".elm", ".purs"]
  },

  resolveLoader: {
    root: __dirname + "/node_modules"
  },

  module: {
    preLoaders: [
      {
        test: /\.js$/,
        loader: "jshint-loader",
        exclude: [/elm-stuff/, /node_modules/]
      }
    ],

    loaders: [
      {
        test: /\.(appcache|html)$/,
        loader: "file?name=[name].[ext]",
        exclude: [/elm-stuff/, /node_modules/]
      },
      {
        test: /\.css$/,
        loader: "style-loader!css-loader",
        exclude: [/elm-stuff/, /node_modules/]
      },
      {
        test: /\.elm$/,
        loader: "elm-webpack-loader?warn=true",
        exclude: [/elm-stuff/, /node_modules/]
      },
      {
        test: /\.glsl$/,
        loader: "raw",
        exclude: [/elm-stuff/, /node_modules/]
      },
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: [/elm-stuff/, /node_modules/]
      },
      {
        test: /\.purs$/,
        loader:
          "purs-loader?output=purescript_modules&" + [
            "src[]=bower_components/purescript-*/src/**/*.purs",
            "src[]=src/**/*.purs",
            "ffi[]=bower_components/purescript-*/src/**/*.js",
            "ffi[]=src/**/*Foreign.js"
          ].join("&")
      }
    ],

    noParse: [/\.elm$/, /proj4\.js$/]
  },

  plugins: [
    new webpack.optimize.OccurenceOrderPlugin()
  ]
};
