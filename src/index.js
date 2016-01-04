"use strict";

require("./index.html");
require("./index.css");
require("./index.appcache");

var Controller = require("./js/Controller");
window.Controller = new Controller();

window.React = require("react/addons");
var r = require("react-wrapper");
var App = r.wrap(require("./js/App"));
window.App = r.render(App(), document.getElementById("app"));

window.Elm = require("./elm/UI");
window.UI = Elm.embed(Elm.UI, document.getElementById("ui"), {
    setLoadingProgress: 0
  });
