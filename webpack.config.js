"use strict";

var webpack = require("webpack");

module.exports = {
  context: __dirname + "/src",
  
  devtool: "eval",
  
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
    new webpack.optimize.OccurenceOrderPlugin()
  ]
};
