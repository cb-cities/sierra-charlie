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
    this.easingRawTime = true;
    this.easeState("rawTime", rawTime, duration, function () {
        this.easingRawTime = false;
      }.bind(this));
  },

  setZoom: function (zoom, duration) {
    this.easingZoom = true;
    this.easeState("zoom", zoom, duration, function () {
        this.easingZoom = false;
      }.bind(this));
  },

  componentDidMount: function () {
    this._geometryLoader = new GeometryLoader({
        onTileLoad: function (tileId, tileData) {
          var canvas = r.domNode(this).firstChild;
          this._renderer.update(canvas, this.left, this.top, this.time, this.zoom);
          this._painter.update(canvas, this.left, this.top, this.time, this.zoom);
        }.bind(this),
      });
    this._renderer = new Renderer({
        getLoadedTile: this._geometryLoader.getLoadedTile.bind(this._geometryLoader),
        onImageRender: function (imageId) {
          var canvas = r.domNode(this).firstChild;
          this._painter.update(canvas, this.left, this.top, this.time, this.zoom);
        }.bind(this)
      });
    this._painter = new Painter({
        getRenderedGroup: this._renderer.getRenderedGroup.bind(this._renderer)
      });
    
    var frame  = r.domNode(this);
    var canvas = frame.firstChild;
    frame.addEventListener("scroll", this.onScroll);
    this.left = this.getEasedState("left");
    this.top  = this.getEasedState("top");
    this.time = compute.time(this.getEasedState("rawTime"));
    this.zoom = this.getEasedState("zoom");
    frame.scrollLeft = compute.scrollLeft(this.left, this.zoom);
    frame.scrollTop  = compute.scrollTop(this.top, this.zoom);
    this._geometryLoader.update(this.left, this.top);
    this._renderer.update(canvas, this.left, this.top, this.time, this.zoom);
    this._painter.update(canvas, this.left, this.top, this.time, this.zoom);
  },

  componentDidUpdate: function () {
    this.update();
  },

  update: function () {
    var frame  = r.domNode(this);
    var canvas = frame.firstChild;
    this.left = this.getEasedState("left");
    this.top  = this.getEasedState("top");
    this.time = compute.time(this.getEasedState("rawTime"));
    this.zoom = this.getEasedState("zoom");
    frame.scrollLeft = compute.scrollLeft(this.left, this.zoom);
    frame.scrollTop  = compute.scrollTop(this.top, this.zoom);
    this._geometryLoader.update(this.left, this.top);
    this._renderer.update(canvas, this.left, this.top, this.time, this.zoom);
    this._painter.update(canvas, this.left, this.top, this.time, this.zoom);
  },

  onScroll: function (event) {
    if (!this.easingLeft && !this.easingTop && !this.easingZoom) {
      var frame = r.domNode(this);
      this.setState({
          left: frame.scrollLeft / compute.spaceWidth(this.zoom),
          top:  frame.scrollTop / compute.spaceHeight(this.zoom)
        });
    }
  },

  onDoubleClick: function (event) {
    // console.log("doubleClick", event.clientX, event.clientY);
    var canvas = r.domNode(this).firstChild;
    var left = compute.fromClientX(event.clientX, canvas.clientWidth, this.left, this.zoom);
    var top  = compute.fromClientY(event.clientY, canvas.clientHeight, this.top, this.zoom);
    var delay = !event.shiftKey ? 500 : 2500;
    this.setLeft(left, delay);
    this.setTop(top, delay);
    if (!event.altKey) {
      this.setZoom(Math.max(0, this.state.zoom - 1), delay);
    } else {
      this.setZoom(Math.min(this.state.zoom + 1, defs.maxZoom), delay);
    }
  },

  render: function () {
    var zoom = this.zoom !== undefined ? this.zoom : this.state.zoom;
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
  }
};

r.makeComponent("App", module);
