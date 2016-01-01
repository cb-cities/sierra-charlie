"use strict";

window.React = require("react/addons");

var r = require("react-wrapper");
var app = r.wrap(require("./app"));
var compute = require("./compute");
var defs = require("./defs");

require("./index.appcache");
require("./index.css");
require("./index.html");

window.Elm = require("./Elm/UI");

function init() {
  var legacy = r.render(app(), document.getElementById("legacy"));

  window.UI = Elm.embed(Elm.UI, document.getElementById("ui"), {
      maxVertexCount: defs.maxVertexCount,
      setVertexCount: 0,
      addRoadNode: null,
      setMousePosition: {x: 0, y: 0}
    });
  
  // UI.ports.left.subscribe(function (left) {
  //     legacy.setLeft(left, 500);
  //   });
  // UI.ports.top.subscribe(function (top) {
  //     legacy.setTop(top, 500);
  //   });
  // UI.ports.zoom.subscribe(function (zoom) {
  //     legacy.setZoom(zoom, 500);
  //   });
}

init();
