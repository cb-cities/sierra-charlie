"use strict";

var GeometryLoader = require("./geometry-loader");
var Painter = require("./painter");
var Renderer = require("./renderer");

var r = require("react-wrapper");
var defs = require("./defs");
var easeStateMixin = require("./ease-state-mixin");
var tmp = require("./tmp");


module.exports = {
  mixins: [
    easeStateMixin
  ],

  getInitialState: function () {
    return {
      leftSignal:    0.4897637424698795,
      topSignal:     0.4768826844262295,
      rawTimeSignal: 10 + 9 / 60,
      zoomSignal:    4
    };
  },

  easeLeft: function (left, duration) {
    this.easingLeft = true;
    this.easeState("leftSignal", left, duration, function () {
        this.easingLeft = false;
      }.bind(this));
  },
 
  easeTop: function (top, duration) {
    this.easingTop = true;
    this.easeState("topSignal", top, duration, function () {
        this.easingTop = false;
      }.bind(this));
  },

  easeRawTime: function (rawTime, duration) {
    this.easingRawTime = true;
    this.easeState("rawTimeSignal", rawTime, duration, function () {
        this.easingRawTime = false;
      }.bind(this));
  },

  easeZoom: function (zoom, duration) {
    this.easingZoom = true;
    this.easeState("zoomSignal", zoom, duration, function () {
        this.easingZoom = false;
      }.bind(this));
  },


  _updateLoader: function () {
    this._geometryLoader.update(this.easedLeftSignal, this.easedTopSignal);
  },

  _updateRenderer: function () {
    this._renderer.update({
        localXSignal:             this.localXSignal,
        localYSignal:             this.localYSignal,
        firstVisibleLocalXSignal: this.firstVisibleLocalXSignal,
        firstVisibleLocalYSignal: this.firstVisibleLocalYSignal,
        lastVisibleLocalXSignal:  this.lastVisibleLocalXSignal,
        lastVisibleLocalYSignal:  this.lastVisibleLocalYSignal,
        easedTimeSignal:          this.easedTimeSignal,
        easedZoomSignal:          this.easedZoomSignal
      });
  },
  
  _updatePainter: function () {
    this._painter.update({
        canvas:                   this.canvas,
        scrollLeftSignal:         this.scrollLeftSignal,
        scrollTopSignal:          this.scrollTopSignal,
        firstVisibleLocalXSignal: this.firstVisibleLocalXSignal,
        firstVisibleLocalYSignal: this.firstVisibleLocalYSignal,
        lastVisibleLocalXSignal:  this.lastVisibleLocalXSignal,
        lastVisibleLocalYSignal:  this.lastVisibleLocalYSignal,
        easedTimeSignal:          this.easedTimeSignal,
        easedZoomSignal:          this.easedZoomSignal,
        groupCount:               this.groupCount,
        groupSize:                this.groupSize,
        firstVisibleGroupX:       this.firstVisibleGroupX,
        firstVisibleGroupY:       this.firstVisibleGroupY,
        lastVisibleGroupX:        this.lastVisibleGroupX,
        lastVisibleGroupY:        this.lastVisibleGroupY,
      });
  },

  onTileLoad: function (tileId, tileData) {
    this._updateRenderer();
    this._updatePainter();
  },
  
  onImageRender: function (imageId) {
    this._updatePainter();
  },

  componentDidMount: function () {
    this._geometryLoader = new GeometryLoader({
        onTileLoad: this.onTileLoad
      });
    this._renderer = new Renderer({
        getLoadedTile: this._geometryLoader.getLoadedTile.bind(this._geometryLoader),
        onImageRender: this.onImageRender
      });
    this._painter = new Painter({
        getRenderedGroup: this._renderer.getRenderedGroup.bind(this._renderer)
      });
    
    this.node = r.domNode(this);
    this.canvas = this.node.firstChild;
    this.node.addEventListener("scroll", this.onScroll);
    this.forceUpdate(); // Trigger a React re-render to update the size of map-space
    this.computeDerivedState();
    this.exportScrollPosition();
    this._updateLoader();
    this._updateRenderer();
    this._updatePainter();
  },

  componentDidUpdate: function () {
    this.update();
  },

  update: function () {
    this.computeDerivedState();
    this.exportScrollPosition();
    this._updateLoader();
    this._updateRenderer();
    this._updatePainter();
  },

  onScroll: function (event) {
    if (!this.easingLeft && !this.easingTop && !this.easingZoom) {
      this.importScrollPosition();
    }
  },

  importScrollPosition: function () {
    this.setState({
        leftSignal: this.node.scrollLeft / this.easedWidth,
        topSignal:  this.node.scrollTop / this.easedHeight
      });
  },

  computeDerivedState: function () {
    this.easedLeftSignal          = this.getEasedState("leftSignal");
    this.easedTopSignal           = this.getEasedState("topSignal");
    this.easedTimeSignal          = tmp.computeTime(this.getEasedState("rawTimeSignal"));
    this.easedZoomSignal          = this.getEasedState("zoomSignal");
    this.easedImageSize           = tmp.computeImageSize(this.easedZoomSignal);
    this.groupCount               = tmp.computeGroupCount(this.easedZoomSignal);
    this.groupSize                = defs.imageSize * this.groupCount;
    this.easedWidth               = defs.tileXCount * this.easedImageSize;
    this.easedHeight              = defs.tileYCount * this.easedImageSize;
    this.scrollLeftSignal         = Math.floor(this.easedLeftSignal * this.easedWidth - this.canvas.clientWidth / 2);
    this.scrollTopSignal          = Math.floor(this.easedTopSignal * this.easedHeight - this.canvas.clientHeight / 2);
    this.localXSignal             = Math.floor(this.easedLeftSignal * defs.tileXCount);
    this.localYSignal             = Math.floor(this.easedTopSignal * defs.tileYCount);
    this.firstVisibleLocalXSignal = defs.clampLocalX(Math.floor(this.scrollLeftSignal / this.easedImageSize));
    this.firstVisibleLocalYSignal = defs.clampLocalY(Math.floor(this.scrollTopSignal / this.easedImageSize));
    this.lastVisibleLocalXSignal  = defs.clampLocalX(Math.floor((this.scrollLeftSignal + this.canvas.clientWidth - 1) / this.easedImageSize));
    this.lastVisibleLocalYSignal  = defs.clampLocalY(Math.floor((this.scrollTopSignal + this.canvas.clientHeight - 1) / this.easedImageSize));
    this.firstVisibleGroupX       = Math.floor(this.firstVisibleLocalXSignal / this.groupCount) * this.groupCount;
    this.firstVisibleGroupY       = Math.floor(this.firstVisibleLocalYSignal / this.groupCount) * this.groupCount;
    this.lastVisibleGroupX        = Math.floor(this.lastVisibleLocalXSignal / this.groupCount) * this.groupCount;
    this.lastVisibleGroupY        = Math.floor(this.lastVisibleLocalYSignal / this.groupCount) * this.groupCount;
  },

  exportScrollPosition: function () {
    this.node.scrollLeft = Math.floor(this.easedLeftSignal * this.easedWidth);
    this.node.scrollTop  = Math.floor(this.easedTopSignal * this.easedHeight);
  },

  onDoubleClick: function (event) {
    // console.log("doubleClick", event.clientX, event.clientY);
    var delay = !event.shiftKey ? 500 : 2500;
    var left = (this.scrollLeftSignal + event.clientX) / this.easedWidth;
    var top  = (this.scrollTopSignal + event.clientY) / this.easedHeight;
    this.easeLeft(Math.max(0, Math.min(left, 1)), delay);
    this.easeTop(Math.max(0, Math.min(top, 1)), delay);
    if (!event.altKey) {
      this.easeZoom(Math.max(0, this.state.zoomSignal - 1), delay);
    } else {
      this.easeZoom(Math.min(this.state.zoomSignal + 1, defs.maxZoom), delay);
    }
  },

  render: function () {
    return (
      r.div("map-frame",
        r.canvas("map-picture"),
        r.div({
            className: "map-space",
            style: {
              width:  this.easedWidth,
              height: this.easedHeight
            },
            onDoubleClick: this.onDoubleClick
          })));
  }
};

r.makeComponent("App", module);
