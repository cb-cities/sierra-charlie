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

window.matchMedia('screen and (min-resolution: 2dppx)').addListener(function (event) {
    console.log("window.devicePixelRatio:", window.devicePixelRatio);
    if (e.matches) {
      /* devicePixelRatio >= 2 */
    } else {
      /* devicePixelRatio < 2 */
    }
  });

addEventListener("keydown", function (event) {
    // console.log("keyDown", event.keyCode);
    var canvas = r.domNode(this).firstChild;
    var pageWidth  = compute.pageWidth(canvas.clientWidth, this.state.zoom);
    var pageHeight = compute.pageHeight(canvas.clientHeight, this.state.zoom);
    var duration = event.shiftKey ? 2500 : 500;
    var timeDelta = (event.ctrlKey || event.altKey) ? 60 : 3600;
    var zoomDelta = (event.altKey || event.ctrlKey) ? 2 : 10;
    switch (event.keyCode) {
      case 37: // left
      case 36: // home
        var left = Math.max(0, this.state.left - pageWidth / (event.keyCode === 36 ? 1 : 10));
        this.setLeft(left, duration);
        break;
      case 39: // right
      case 35: // end
        var left = Math.min(this.state.left + pageWidth / (event.keyCode === 35 ? 1 : 10), 1);
        this.setLeft(left, duration);
        break;
      case 38: // up
      case 33: // page up
        var top = Math.max(0, this.state.top - pageHeight / (event.keyCode === 33 ? 1 : 10));
        this.setTop(top, duration);
        break;
      case 40: // down
      case 34: // page down
        var top = Math.min(this.state.top + pageHeight / (event.keyCode === 34 ? 1 : 10), 1);
        this.setTop(top, duration);
        break;
      case 219: // left bracket
        var rawTime = Math.round((this.state.rawTime * 3600) - timeDelta) / 3600;
        this.setRawTime(rawTime, duration);
        break;
      case 221: // right bracket
        var rawTime = Math.round((this.state.rawTime * 3600) + timeDelta) / 3600;
        this.setRawTime(rawTime, duration);
        break;
      case 187: // plus
        var zoom = Math.max(0, (Math.round((this.state.zoom * 10) - zoomDelta) / 10));
        this.setZoom(zoom, duration);
        break;
      case 189: // minus
        var zoom = Math.min(Math.round((this.state.zoom * 10) + zoomDelta) / 10, defs.maxZoom);
        this.setZoom(zoom, duration);
        break;
      default:
        if (event.keyCode >= 49 && event.keyCode <= 56) {
          var zoom = event.keyCode - 49;
          this.setZoom(zoom, duration);
        }
    }
  }.bind(that));
