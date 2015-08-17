"use strict";

var webpack = require("webpack");

module.exports = {
  context: __dirname + "/src",
  devtool: "eval",
  entry: "./index",
  output: {
    path: __dirname,
    filename: "bundle.js",
    publicPath: "/"
  },
  resolve: {
    extensions: ["", ".js"]
  },
  resolveLoader: {
    root: __dirname + "/node_modules"
  },
  module: {
    loaders: [{
      test: /\.css$/,
      loader: "style-loader!css-loader"
    }]
  },
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin()
  ]
};
