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
    publicPath: config.output.publicPath,
    stats: {
      colors: true
    }
  }));
app.use(webpackHotMiddleware(compiler));

function endsWith(s, t) {
  return s.indexOf(t, s.length - t.length) !== -1;
}

app.use("/json", express.static("json", {
    setHeaders: function (res, path, stat) {
      if (endsWith(path, ".json")) {
        res.setHeader("Content-Type", "application/json");
      } else if (endsWith(path, ".json.gz")) {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Encoding", "gzip");
      }
    }
  }));

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/src/index.html");
  });

app.listen(3000, "0.0.0.0", function (err) {
    console.log(err ? err : "Listening at http://0.0.0.0:3000");
  });
