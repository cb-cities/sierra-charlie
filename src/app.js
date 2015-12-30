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
      zoom:    5
    };
  },
  
  setLeft: function (left, duration) {
    this.easingLeft = true;
    this.easeState("left", left, duration, function () {
        this.easingLeft = false;
      }.bind(this));
  },
 
  setTop: function (top, duration) {
    this.easingTop = true;
    this.easeState("top", top, duration, function () {
        this.easingTop = false;
      }.bind(this));
  },

  setRawTime: function (rawTime, duration) {
    this.easeState("rawTime", rawTime, duration);
  },

  setZoom: function (zoom, duration) {
    this.easingZoom = true;
    this.easeState("zoom", zoom, duration, function () {
        this.easingZoom = false;
      }.bind(this));
  },
  
  getDerivedState: function () {
    var frame  = r.domNode(this);
    var canvas = frame.firstChild;
    return {
      width:  canvas.clientWidth,
      height: canvas.clientHeight,
      left:   this.getEasedState("left"),
      top:    this.getEasedState("top"),
      time:   compute.time(this.getEasedState("rawTime")),
      zoom:   this.getEasedState("zoom")
    };
  },
  
  updateFrame: function (left, top, zoom) {
    var frame = r.domNode(this);
    var left  = this.getEasedState("left");
    var top   = this.getEasedState("top");
    var zoom  = this.getEasedState("zoom");
    
    frame.scrollLeft = compute.frameScrollLeft(left, zoom);
    frame.scrollTop  = compute.frameScrollTop(top, zoom);
  },

  componentDidMount: function () {
    var useWebGL = true;
    
    this._geometryLoader = new GeometryLoader({
        getDerivedState: this.getDerivedState,
        onTileLoad:      this.onTileLoad
      });
      
    this._renderer = new Renderer({
        useWebGL:        useWebGL,
        getDerivedState: this.getDerivedState,
        getLoadedTile:   this._geometryLoader.getLoadedTile.bind(this._geometryLoader),
        onImageRender:   this.onImageRender
      });

    var frame  = r.domNode(this);
    var canvas = frame.firstChild;
    this._painter = new Painter({
        useWebGL:         useWebGL,
        canvas:           canvas,
        getLoadedTile:    this._geometryLoader.getLoadedTile.bind(this._geometryLoader),
        getLoadedTileIds: this._geometryLoader.getLoadedTileIds.bind(this._geometryLoader),
        getDerivedState:  this.getDerivedState,
        getRenderedGroup: this._renderer.getRenderedGroup.bind(this._renderer)
      });

    frame.addEventListener("scroll", this.onScroll);
    canvas.addEventListener("webglcontextlost", this.onLoseContext);
    canvas.addEventListener("webglcontextrestored", this.onRestoreContext);
    addEventListener("resize", this.onResize);
    addEventListener("keydown", this.onKeyDown);

    this.updateFrame();
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
    this.updateFrame();
    
    this._geometryLoader.update();
    this._renderer.update();
    this._painter.update();
  },
  
  onTileLoad: function () {
    this._renderer.update();
    this._painter.update();
  },
  
  onImageRender: function () {
    this._painter.update();
  },
  
  onScroll: function (event) {
    if (!this.easingLeft && !this.easingTop && !this.easingZoom) {
      var frame = r.domNode(this);
      var zoom  = this.getEasedState("zoom");
      this.setState({
          left: compute.leftFromFrameScrollLeft(frame.scrollLeft, zoom),
          top:  compute.topFromFrameScrollTop(frame.scrollTop, zoom)
        });
    }
  },
  
  onLoseContext: function (event) {
    event.preventDefault();
    this._painter.loseContext();
  },
  
  onRestoreContext: function () {
    this._painter.restoreContext();
  },
  
  onResize: function (event) {
    this._renderer.update();
    this._painter.update();
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
        if (event.keyCode >= 49 && event.keyCode <= 57) {
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
    var left   = compute.leftFromEventClientX(event.clientX, width, this.state.left, this.state.zoom);
    var top    = compute.topFromEventClientY(event.clientY, height, this.state.top, this.state.zoom);
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
