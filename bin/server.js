"use strict";

var express = require("express");
var path = require("path");


function endsWith(s, t) {
  return s.indexOf(t, s.length - t.length) !== -1;
}


var app = express();
var dir = path.dirname(__dirname);

app.use("/", express.static(dir + "/out"));
app.use("/json", express.static(dir + "/json", {
  maxAge: "1h",
  setHeaders: function (res, path, stat) {
    if (endsWith(path, ".json")) {
      res.setHeader("Content-Type", "application/json");
    } else if (endsWith(path, ".json.gz")) {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Encoding", "gzip");
    }
  }
}));

app.listen(3000, "0.0.0.0", function (err) {
  console.log(err ? err : "Listening at http://0.0.0.0:3000");
});
