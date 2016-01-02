"use strict";

window.React = require("react/addons");

var r = require("react-wrapper");

window.Elm = require("./elm/UI");

var app = r.wrap(require("./js/app"));
var compute = require("./js/compute");
var defs = require("./js/defs");

require("./index.appcache");
require("./index.css");
require("./index.html");


function init() {
  var map = r.render(app(), document.getElementById("map"));

  window.UI = Elm.embed(Elm.UI, document.getElementById("ui"), {
      maxVertexCount: defs.maxVertexCount,
      setVertexCount: 0,
      addRoadNode: null,
      setMousePosition: {x: 0, y: 0}
    });
  
  // UI.ports.left.subscribe(function (left) {
  //     map.setLeft(left, 500);
  //   });
  // UI.ports.top.subscribe(function (top) {
  //     map.setTop(top, 500);
  //   });
  // UI.ports.zoom.subscribe(function (zoom) {
  //     map.setZoom(zoom, 500);
  //   });
}

init();
