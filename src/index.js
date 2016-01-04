"use strict";

window.React = require("react/addons");

var r = require("react-wrapper");

window.Elm = require("./elm/UI");

var App = r.wrap(require("./js/App"));
var Controller = require("./js/Controller");
var compute = require("./js/compute");
var defs = require("./js/defs");

require("./index.appcache");
require("./index.css");
require("./index.html");


function init() {
  var controller = new Controller({
      tileSize: defs.tileSize,
      imageSize: defs.imageSize,
      firstTileX: defs.firstTileX,
      lastTileY: defs.lastTileY,
      tileXCount: defs.tileXCount,
      tileYCount: defs.tileYCount,
      treeLeft: 465464, // TODO
      treeTop: 112964, // TODO
      treeSize: 131072, // TODO
      maxZoom: defs.maxZoom
    });

  addEventListener("keydown", controller.onKeyDown.bind(controller));

  var frame = document.getElementById("map-frame");

  var canvas = document.getElementById("map-canvas");

  var space = document.getElementById("map-space");
  space.addEventListener("dblclick", controller.onDoubleClick.bind(controller));
  space.addEventListener("mousemove", controller.onMouseMove.bind(controller));

  window.App = r.render(App({
    }),
    document.getElementById("app"));

  window.UI = Elm.embed(Elm.UI, document.getElementById("ui"), {
      maxVertexCount: defs.maxVertexCount,
      setVertexCount: 0,
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
