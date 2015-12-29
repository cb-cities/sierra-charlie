"use strict";

var GeometryLoader = require("./geometry-loader");
var Painter = require("./painter");
var Renderer = require("./renderer");

var r = require("react-wrapper");
var compute = require("./compute");
var defs = require("./defs");
var easeStateMixin = require("./ease-state-mixin");


module.exports = {
  mixins: [
    easeStateMixin
  ],

  getInitialState: function () {
    return {
      left:    0.4897637424698795,
      top:     0.4768826844262295,
      rawTime: 10 + 9 / 60,
      zoom:    4
    };
  },
  
  setLeft: function (left, duration) {
    this.ignoreScroll++;
    this.easeState("left", left, duration, function () {
        this.ignoreScroll--;
      }.bind(this));
  },
 
  setTop: function (top, duration) {
    this.ignoreScroll++;
    this.easeState("top", top, duration, function () {
        this.ignoreScroll--;
      }.bind(this));
  },

  setRawTime: function (rawTime, duration) {
    this.easeState("rawTime", rawTime, duration);
  },

  setZoom: function (zoom, duration) {
    this.ignoreScroll++;
    this.easeState("zoom", zoom, duration, function () {
        this.ignoreScroll--;
      }.bind(this));
  },
  
  updateFrame: function (left, top, zoom) {
    var frame = r.domNode(this);
    frame.scrollLeft = compute.scrollLeft(left, zoom);
    frame.scrollTop  = compute.scrollTop(top, zoom);
  },

  componentDidMount: function () {
    this.ignoreScroll = 0;
    
    this._geometryLoader = new GeometryLoader({
        onTileLoad: this.onTileLoad
      });
      
    this._renderer = new Renderer({
        getLoadedTile: this._geometryLoader.getLoadedTile.bind(this._geometryLoader),
        onImageRender: this.onImageRender
      });

    var frame  = r.domNode(this);
    var canvas = frame.firstChild;
    this._painter = new Painter(canvas, {
        getRenderedGroup: this._renderer.getRenderedGroup.bind(this._renderer)
      });

    frame.addEventListener("scroll", this.onScroll);
    addEventListener("resize", this.onResize);
    addEventListener("keydown", this.onKeyDown);

    this.updateFrame(this.state.left, this.state.top, this.state.zoom);
  },
  
  render: function () {
    var zoom = this.getEasedState("zoom");
    return (
      r.div("map-frame",
        r.canvas("map-canvas"),
        r.div({
            className: "map-space",
            style: {
              width:  compute.spaceWidth(zoom),
              height: compute.spaceHeight(zoom)
            },
            onDoubleClick: this.onDoubleClick
          })));
  },

  componentDidUpdate: function () {
    var frame  = r.domNode(this);
    var canvas = frame.firstChild;
    var width  = canvas.clientWidth;
    var height = canvas.clientHeight;
    var left   = this.getEasedState("left");
    var top    = this.getEasedState("top");
    var time   = compute.time(this.getEasedState("rawTime"));
    var zoom   = this.getEasedState("zoom");
    
    this.updateFrame(left, top, zoom);
    
    this._geometryLoader.update(left, top);
    this._renderer.update(width, height, left, top, time, zoom);
    this._painter.update(left, top, time, zoom);
  },
  
  onTileLoad: function () {
    var canvas = r.domNode(this).firstChild;
    var width  = canvas.clientWidth;
    var height = canvas.clientHeight;
    var left   = this.getEasedState("left");
    var top    = this.getEasedState("top");
    var time   = compute.time(this.getEasedState("rawTime"));
    var zoom   = this.getEasedState("zoom");
    
    this._renderer.update(width, height, left, top, time, zoom);
    this._painter.update(left, top, time, zoom);
  },
  
  onImageRender: function () {
    var canvas = r.domNode(this).firstChild;
    var left   = this.getEasedState("left");
    var top    = this.getEasedState("top");
    var time   = compute.time(this.getEasedState("rawTime"));
    var zoom   = this.getEasedState("zoom");
    
    this._painter.update(left, top, time, zoom);
  },
  
  onScroll: function (event) {
    if (!this.ignoreScroll) {
      var frame = r.domNode(this);
      var zoom  = this.getEasedState("zoom");
      this.setState({
          left: frame.scrollLeft / compute.spaceWidth(zoom),
          top:  frame.scrollTop / compute.spaceHeight(zoom)
        });
    }
  },
  
  onResize: function (event) {
    // this.forceUpdate(); // In lieu of this.setSize()
  },

  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    var canvas     = r.domNode(this).firstChild;
    var width      = canvas.clientWidth;
    var height     = canvas.clientHeight;
    var pageWidth  = compute.pageWidth(width, this.state.zoom);
    var pageHeight = compute.pageHeight(height, this.state.zoom);
    var duration   = event.shiftKey ? 2500 : 500;
    var timeDelta  = (event.ctrlKey || event.altKey) ? 60 : 3600;
    var zoomDelta  = (event.altKey || event.ctrlKey) ? 2 : 10;
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
  },

  onDoubleClick: function (event) {
    // console.log("doubleClick", event.clientX, event.clientY);
    var canvas = r.domNode(this).firstChild;
    var width  = canvas.clientWidth;
    var height = canvas.clientHeight;
    var left   = compute.fromMouseX(event.clientX, width, this.state.left, this.state.zoom);
    var top    = compute.fromMouseY(event.clientY, height, this.state.top, this.state.zoom);
    var duration = !event.shiftKey ? 500 : 2500;
    this.setLeft(left, duration);
    this.setTop(top, duration);
    if (!event.altKey) {
      this.setZoom(Math.max(0, this.state.zoom - 1), duration);
    } else {
      this.setZoom(Math.min(this.state.zoom + 1, defs.maxZoom), duration);
    }
  }
};

r.makeComponent("App", module);
