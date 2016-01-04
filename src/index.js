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
  var controller = new Controller();
  frame.addEventListener("scroll", controller.onFrameScrolled.bind(controller));
  canvas.addEventListener("webglcontextlost", controller.onCanvasContextLost.bind(controller));
  canvas.addEventListener("webglcontextrestored", controller.onCanvasContextRestored.bind(controller));
  space.addEventListener("mousemove", controller.onMouseMoved.bind(controller));
  space.addEventListener("dblclick", controller.onMouseDoubleClicked.bind(controller));
  window.addEventListener("keydown", controller.onKeyPressed.bind(controller));
  window.addEventListener("resize", controller.onWindowResized.bind(controller));
  window.addEventListener("orientationchange", controller.onWindowResized.bind(controller));
  window.matchMedia("screen and (min-resolution: 2dppx)").addListener(controller.onWindowResized.bind(controller));
  window.App = r.render(App(), document.getElementById("app"));
  window.UI = Elm.embed(Elm.UI, document.getElementById("ui"), {
      maxVertexCount: defs.maxVertexCount,
      setVertexCount: 0,
      setMousePosition: {x: 0, y: 0}
    });
}

init();
