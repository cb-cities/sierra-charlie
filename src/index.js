"use strict";

window.React = require("react/addons");
var r = require("react-wrapper");

var Controller = require("./js/Controller");
var app = r.wrap(require("./js/App"));
window.Elm = require("./elm/UI");

require("./index.html");
require("./index.css");
require("./index.appcache");


window.Controller = new Controller();
window.App = r.render(app(), document.getElementById("app"));
window.UI = Elm.embed(Elm.UI, document.getElementById("ui"), {
    setLoadingProgress: 0,
    setHoveredFeature: null,
    setSelectedFeature: null
  });
