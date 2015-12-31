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

function init(storedModel) {
  var legacy = r.render(app(), document.getElementById("legacy"));

  window.UI = Elm.embed(Elm.UI, document.getElementById("ui"), {
      storedModel: storedModel,
      vertexCount: 0,
      maxVertexCount: defs.maxVertexCount
    });
  
  UI.ports.model.subscribe(function (model) {
      var state = JSON.stringify(model);
      localStorage.setItem("elm-ui-state", state);
    });
  
  UI.ports.left.subscribe(function (left) {
      // legacy.setLeft(left, 500);
    });
  UI.ports.top.subscribe(function (top) {
      // legacy.setTop(top, 500);
    });
  UI.ports.zoom.subscribe(function (zoom) {
      // legacy.setZoom(zoom, 500);
    });
}

// try {
//   var storedState = localStorage.getItem("elm-ui-state");
//   var storedModel = storedState ? JSON.parse(storedState) : null;
//   init(storedModel);
// } catch (e) {
//   init(null);
// }

init(null);
