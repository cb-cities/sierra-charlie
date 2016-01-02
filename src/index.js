"use strict";

window.React = require("react/addons");

var r = require("react-wrapper");
var app = r.wrap(require("./app"));

require("./index.appcache");
require("./index.css");
require("./index.html");

var fragmentShader = require("./shaders/fragment-shader.glsl");
var vertexShader = require("./shaders/vertex-shader.glsl");

r.render(app(), document.getElementById("root"));
