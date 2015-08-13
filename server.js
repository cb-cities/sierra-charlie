"use strict";

var express = require("express");
var webpack = require("webpack");
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpackHotMiddleware = require("webpack-hot-middleware");
var config = require("./webpack.config");

var app = express();
var compiler = webpack(config);

app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPath
  }));
app.use(webpackHotMiddleware(compiler));

app.use("/static", express.static("static"));

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
  });

app.listen(3000, "0.0.0.0", function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log("Listening at http://0.0.0.0:3000");
    }
  });
