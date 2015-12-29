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

addEventListener("resize", function (event) {
    this.update();
  }.bind(that));

addEventListener("keydown", function (event) {
    // console.log("keyDown", event.keyCode);
    var pageWidth  = compute.pageWidth(this.canvas.clientWidth, this.zoom);
    var pageHeight = compute.pageHeight(this.canvas.clientHeight, this.zoom);
    var delay = event.shiftKey ? 2500 : 500;
    var timeDelta = (event.ctrlKey || event.altKey) ? 60 : 3600;
    var zoomDelta = (event.altKey || event.ctrlKey) ? 2 : 10;
    switch (event.keyCode) {
      case 37: // left
      case 36: // home
        var left = Math.max(0, this.state.leftSignal - pageWidth / (event.keyCode === 36 ? 1 : 10));
        this.easeLeft(left, delay);
        break;
      case 39: // right
      case 35: // end
        var left = Math.min(this.state.leftSignal + pageWidth / (event.keyCode === 35 ? 1 : 10), 1);
        this.easeLeft(left, delay);
        break;
      case 38: // up
      case 33: // page up
        var top = Math.max(0, this.state.topSignal - pageHeight / (event.keyCode === 33 ? 1 : 10));
        this.easeTop(top, delay);
        break;
      case 40: // down
      case 34: // page down
        var top = Math.min(this.state.topSignal + pageHeight / (event.keyCode === 34 ? 1 : 10), 1);
        this.easeTop(top, delay);
        break;
      case 219: // left bracket
        var rawTime = Math.round((this.state.rawTimeSignal * 3600) - timeDelta) / 3600;
        this.easeRawTime(rawTime, delay);
        break;
      case 221: // right bracket
        var rawTime = Math.round((this.state.rawTimeSignal * 3600) + timeDelta) / 3600;
        this.easeRawTime(rawTime, delay);
        break;
      case 187: // plus
        var zoom = Math.max(0, (Math.round((this.state.zoomSignal * 10) - zoomDelta) / 10));
        this.easeZoom(zoom, delay);
        break;
      case 189: // minus
        var zoom = Math.min(Math.round((this.state.zoomSignal * 10) + zoomDelta) / 10, defs.maxZoom);
        this.easeZoom(zoom, delay);
        break;
      default:
        if (event.keyCode >= 49 && event.keyCode <= 56) {
          var zoom = event.keyCode - 49;
          this.easeZoom(zoom, delay);
        }
    }
  }.bind(that));
