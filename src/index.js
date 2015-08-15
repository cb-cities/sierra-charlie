"use strict";

window.React = require("react/addons");

var r = require("react-wrapper");
var app = r.wrap(require("./app"));

require("./index.css");

r.render(app(), document.getElementById("root"));
