"use strict";

var webpack = require("webpack");

module.exports = {
  context: __dirname + "/src",
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
