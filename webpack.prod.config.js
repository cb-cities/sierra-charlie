"use strict";

var webpack = require("webpack");

module.exports = {
  context: __dirname + "/src",

  entry: "./index.js",
  
  output: {
    path: __dirname + "/dist",
    filename: "index.js",
    publicPath: "/"
  },
  
  resolve: {
    extensions: ["", ".js", ".elm"]
  },
  
  resolveLoader: {
    root: __dirname + "/node_modules"
  },
  
  module: {
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
        loader: "elm-webpack-loader",
        exclude: [/elm-stuff/, /node_modules/]
      },
      {
        test: /\.glsl$/,
        loader: 'raw',
        exclude: [/elm-stuff/, /node_modules/]
      }
    ]
  },
  
  plugins: [
    new webpack.DefinePlugin({
        "process.env": {
          "NODE_ENV": JSON.stringify("production")
        }
      }),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
        compressor: {
          warnings: false
        }
      })
  ]
};
