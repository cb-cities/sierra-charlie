"use strict";

var http = require("http");
var request = require("request");


http.createServer(function (req, clientRes) {
  var url = req.url.slice(1);
  var headers = new Array(req.headers["access-control-request-headers"]);
  clientRes.setHeader("access-control-allow-headers", headers.join(", "));
  clientRes.setHeader("access-control-allow-methods", "GET, POST, PUT, DELETE");
  clientRes.setHeader("access-control-allow-origin", "*");
  clientRes.setTimeout(60000);
  if (req.method === "OPTIONS") {
    console.log("200 " + req.method + " " + url);
    clientRes.statusCode = 200;
    clientRes.end();
  } else {
    try {
      request(url, {
        encoding: null,
        strictSSL: false,
        headers: !req.headers["authorization"] ? null : {
          authorization: req.headers["authorization"]
        }
      }, function (err, serverRes, body) {
        console.log(serverRes.statusCode + " " + req.method + " " + url);
        if (serverRes.statusCode < 200 || serverRes.statusCode >= 400) {
          console.log("  " + body.toString());
        }
        clientRes.statusCode = serverRes.statusCode;
        clientRes.write(body);
        clientRes.end();
      });
    } catch (e) {
      console.log("502 " + req.method + " " + url);
      console.log("  " + e);
      clientRes.statusCode = 502;
      clientRes.write("" + e);
      clientRes.end();
    }
  }
}).listen(4000, "0.0.0.0", null, function () {
  console.log("Proxy listening at http://0.0.0.0:4000");
});
