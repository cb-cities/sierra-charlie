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
  var frame = document.getElementById("map-frame");
  var canvas = document.getElementById("map-canvas");
  var space = document.getElementById("map-space");
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
      maxVertexCount: defs.maxVertexCount,
      maxRoadNodeIndexCount: defs.maxRoadNodeIndexCount,
      maxRoadLinkIndexCount: defs.maxRoadLinkIndexCount,
      maxZoom: defs.maxZoom,
      origin: window.location.origin
    });
  frame.addEventListener("scroll", controller.onScroll.bind(controller));
  canvas.addEventListener("webglcontextlost", controller.onContextLost.bind(controller));
  canvas.addEventListener("webglcontextrestored", controller.onContextRestored.bind(controller));
  space.addEventListener("mousemove", controller.onMouseMove.bind(controller));
  space.addEventListener("dblclick", controller.onDoubleClick.bind(controller));
  window.addEventListener("keydown", controller.onKeyDown.bind(controller));
  window.addEventListener("resize", function () {
      App.needsPainting = true; // TODO
    });
  window.addEventListener("orientationchange", function () {
      console.log("device orientation changed");
      App.needsPainting = true; // TODO
    });
  window.matchMedia("screen and (min-resolution: 2dppx)").addListener(function () {
      console.log("device pixel ratio changed to", window.devicePixelRatio);
      App.needsPainting = true; // TODO
    });

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
