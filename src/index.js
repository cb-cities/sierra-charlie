"use strict";

window.React = require("react/addons");

var r = require("react-wrapper");
var app = r.wrap(require("./app"));
var compute = require("./compute");
var defs = require("./defs");

require("./index.appcache");
require("./index.css");
require("./index.html");

var fragmentShader = require("./shaders/fragment-shader.glsl");
var vertexShader = require("./shaders/vertex-shader.glsl");


var that = r.render(app(), document.getElementById("root"));
