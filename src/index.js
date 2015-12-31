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


var legacy = r.render(app(), document.getElementById("legacy"));

var storedState = localStorage.getItem("elm-ui-state");
var restoredState = storedState ? JSON.parse(storedState) : null;

var ui = Elm.embed(Elm.UI, document.getElementById("ui"), {
    getState: restoredState
  });
  
ui.ports.setState.subscribe(function (state) {
    localStorage.setItem("elm-ui-state", JSON.stringify(state));
  });
  
ui.ports.setLeft.subscribe(function (left) {
    legacy.setLeft(left, 500);
  });
ui.ports.setTop.subscribe(function (top) {
    legacy.setTop(top, 500);
  });
ui.ports.setZoom.subscribe(function (zoom) {
    legacy.setZoom(zoom, 500);
  });

window.ui = ui;
