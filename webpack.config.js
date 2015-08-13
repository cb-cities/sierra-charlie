var webpack = require("webpack");

module.exports = {
  context: __dirname + "/src",

  entry: [
    "webpack/hot/only-dev-server",
    "webpack-hot-middleware/client",
    "./index"
  ],

  output: {
    path: __dirname + "/dist",
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
      include: __dirname + "/src",
      test: /\.js$/,
      loaders: ["react-hot"]
    }]
  },

  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ]
};
