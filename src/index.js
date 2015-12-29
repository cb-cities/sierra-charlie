"use strict";

window.React = require("react/addons");

var r = require("react-wrapper");
var app = r.wrap(require("./app"));
var defs = require("./defs");

require("./index.appcache");
require("./index.css");
require("./index.html");

var fragmentShader = require("./shaders/fragment-shader.glsl");
var vertexShader = require("./shaders/vertex-shader.glsl");


var that = r.render(app(), document.getElementById("root"));

addEventListener("resize", function (event) {
    this.update();
  }.bind(that));

addEventListener("keydown", function (event) {
    // console.log("keyDown", event.keyCode);
    var pageWidth  = 1 / (this.easedWidth / this.node.clientWidth);
    var pageHeight = 1 / (this.easedHeight / this.node.clientHeight);
    var delay = event.shiftKey ? 2500 : 500;
    var timeDelta = (event.ctrlKey || event.altKey) ? 60 : 3600;
    var zoomDelta = (event.altKey || event.ctrlKey) ? 2 : 10;
    switch (event.keyCode) {
      case 37: // left
      case 36: // home
        var left = this.state.leftSignal - pageWidth / (event.keyCode === 36 ? 1 : 10);
        this.easeSignalLeft(Math.max(0, left), delay);
        break;
      case 39: // right
      case 35: // end
        var left = this.state.leftSignal + pageWidth / (event.keyCode === 35 ? 1 : 10);
        this.easeSignalLeft(Math.min(left, 1), delay);
        break;
      case 38: // up
      case 33: // page up
        var top = this.state.topSignal - pageHeight / (event.keyCode === 33 ? 1 : 10);
        this.easeSignalTop(Math.max(0, top), delay);
        break;
      case 40: // down
      case 34: // page down
        var top = this.state.topSignal + pageHeight / (event.keyCode === 34 ? 1 : 10);
        this.easeSignalTop(Math.min(top, 1), delay);
        break;
      case 219: // left bracket
        var rawTimeSignal = (Math.round((this.state.rawTimeSignal * 3600) - timeDelta) / 3600);
        this.easeTimeSignal(rawTimeSignal, delay);
        break;
      case 221: // right bracket
        var rawTimeSignal = (Math.round((this.state.rawTimeSignal * 3600) + timeDelta) / 3600);
        this.easeTimeSignal(rawTimeSignal, delay);
        break;
      case 187: // plus
        var zoomSignal = Math.max(0, (Math.round((this.state.zoomSignal * 10) - zoomDelta) / 10));
        this.easeZoomSignal(zoomSignal, delay);
        break;
      case 189: // minus
        var zoomSignal = Math.min(Math.round((this.state.zoomSignal * 10) + zoomDelta) / 10, defs.maxZoomSignal);
        this.easeZoomSignal(zoomSignal, delay);
        break;
      default:
        if (event.keyCode >= 49 && event.keyCode <= 56) {
          this.easeZoomSignal(event.keyCode - 49, delay);
        }
    }
  }.bind(that));
