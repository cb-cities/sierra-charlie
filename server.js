"use strict";

var express = require("express");

function endsWith(s, t) {
  return s.indexOf(t, s.length - t.length) !== -1;
}

var app = express();
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/dist/index.html");
  });
app.get("/index.appcache", function (req, res) {
    res.sendFile(__dirname + "/dist/index.appcache");
  });
app.get("/index.html", function (req, res) {
    res.sendFile(__dirname + "/dist/index.html");
  });
app.get("/index.js", function (req, res) {
    res.sendFile(__dirname + "/dist/index.js");
  });
app.use("/json", express.static("json", {
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
