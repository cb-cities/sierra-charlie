"use strict";

var express = require("express");

function endsWith(s, t) {
  return s.indexOf(t, s.length - t.length) !== -1;
}

var app = express();
app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
  });
app.get("/bundle.js", function (req, res) {
    res.sendFile(__dirname + "/bundle.js");
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
