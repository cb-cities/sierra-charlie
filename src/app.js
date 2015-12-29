"use strict";

var GeometryLoader = require("./geometry-loader");
var Painter = require("./painter");
var Renderer = require("./renderer");

var r = require("react-wrapper");
var defs = require("./defs");
var easeStateMixin = require("./ease-state-mixin");


function computeTimeValue(rawTimeValue) {
  return (
    rawTimeValue >= 0 ?
      Math.round((rawTimeValue * 3600) % (24 * 3600)) / 3600 :
      24 - Math.round((-rawTimeValue * 3600) % (24 * 3600)) / 3600);
}

function computeTimeSlice(timeValue) {
  return (
    (timeValue >=  8 && timeValue < 10) ? 1 :
    (timeValue >= 10 && timeValue < 13) ? 2 :
    (timeValue >= 13 && timeValue < 16) ? 3 :
    (timeValue >= 16 && timeValue < 19) ? 4 :
    (timeValue >= 19 && timeValue < 21) ? 5 :
    0);
}


module.exports = {
  mixins: [
    easeStateMixin
  ],

  getInitialState: function () {
    return {
      signalLeft: 0.4897637424698795,
      signalTop: 0.4768826844262295,
      rawTimeValue: 10 + 9 / 60,
      zoomPower: 4
    };
  },

  easeSignalLeft: function (signalLeft, duration) {
    this.easingSignalLeft = true;
    this.easeState("signalLeft", signalLeft, duration, function () {
        this.easingSignalLeft = false;
      }.bind(this));
  },
 
  easeSignalTop: function (signalTop, duration) {
    this.easingSignalTop = true;
    this.easeState("signalTop", signalTop, duration, function () {
        this.easingSignalTop = false;
      }.bind(this));
  },

  easeTimeValue: function (rawTimeValue, duration) {
    this.easingRawTimeValue = true;
    this.easeState("rawTimeValue", rawTimeValue, duration, function () {
        this.easingRawTimeValue = false;
      }.bind(this));
  },

  easeZoomPower: function (zoomPower, duration) {
    this.easingZoomPower = true;
    this.easeState("zoomPower", zoomPower, duration, function () {
        this.easingZoomPower = false;
      }.bind(this));
  },


  _updateLoader: function () {
    this._geometryLoader.update(this.easedSignalLeft, this.easedSignalTop);
  },

  _updateRenderer: function () {
    this._renderer.update({
        floorSignalTime:         this.floorSignalTime,
        floorSignalZoom:         this.floorSignalZoom,
      
        signalLocalX:        this.signalLocalX,
        signalLocalY:        this.signalLocalY,
        firstVisibleLocalX:     this.firstVisibleLocalX,
        lastVisibleLocalX:      this.lastVisibleLocalX,
        firstVisibleLocalY:     this.firstVisibleLocalY,
        lastVisibleLocalY:      this.lastVisibleLocalY
      });
  },
  
  _updatePainter: function () {
    this._painter.update({
        floorSignalTime:     this.floorSignalTime,
      
        scrollLeft:         this.scrollLeft,
        scrollTop:          this.scrollTop,
      
        canvas:             this.canvas,
        roundZoomPower:     this.roundZoomPower,
        easedZoomPower:     this.easedZoomPower,
        easedZoomLevel:     this.easedZoomLevel,
        groupCount:         this.groupCount,
        groupSize:          this.groupSize,
        firstVisibleLocalX: this.firstVisibleLocalX,
        lastVisibleLocalX:  this.lastVisibleLocalX,
        firstVisibleLocalY: this.firstVisibleLocalY,
        lastVisibleLocalY:  this.lastVisibleLocalY,
        firstVisibleGroupX: this.firstVisibleGroupX,
        lastVisibleGroupX:  this.lastVisibleGroupX,
        firstVisibleGroupY: this.firstVisibleGroupY,
        lastVisibleGroupY:  this.lastVisibleGroupY
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
    if (!this.easingSignalLeft && !this.easingSignalTop && !this.easingZoomPower) {
      this.importScrollPosition();
    }
  },

  importScrollPosition: function () {
    this.setState({
        signalLeft: this.node.scrollLeft / this.easedWidth,
        signalTop:  this.node.scrollTop / this.easedHeight
      });
  },

  computeDerivedState: function () {
    this.easedSignalLeft = this.getEasedState("signalLeft");
    this.easedSignalTop  = this.getEasedState("signalTop");
    this.easedTimeValue     = computeTimeValue(this.getEasedState("rawTimeValue"));
    this.easedZoomPower     = this.getEasedState("zoomPower");
    this.floorSignalTime    = Math.floor(this.easedTimeValue);
    this.timeSlice          = computeTimeSlice(this.floorSignalTime);
    this.floorSignalZoom    = Math.floor(this.easedZoomPower);
    this.roundZoomPower     = Math.round(this.easedZoomPower);
    this.ceilZoomPower      = Math.ceil(this.easedZoomPower);
    this.easedZoomLevel     = Math.pow(2, this.easedZoomPower);
    this.easedImageSize     = defs.imageSize / this.easedZoomLevel;
    this.groupCount         = Math.pow(2, this.roundZoomPower);
    this.groupSize          = defs.imageSize * this.groupCount;
    this.easedWidth         = defs.tileXCount * this.easedImageSize;
    this.easedHeight        = defs.tileYCount * this.easedImageSize;
    
    this.scrollLeft         = Math.floor(this.easedSignalLeft * this.easedWidth - this.canvas.clientWidth / 2);
    this.scrollTop          = Math.floor(this.easedSignalTop * this.easedHeight - this.canvas.clientHeight / 2);
    this.signalLocalX    = Math.floor(this.easedSignalLeft * defs.tileXCount);
    this.signalLocalY    = Math.floor(this.easedSignalTop * defs.tileYCount);
    
    this.firstVisibleLocalX = defs.clampLocalX(Math.floor(this.scrollLeft / this.easedImageSize));
    this.lastVisibleLocalX  = defs.clampLocalX(Math.floor((this.scrollLeft + this.canvas.clientWidth - 1) / this.easedImageSize));
    this.firstVisibleLocalY = defs.clampLocalY(Math.floor(this.scrollTop / this.easedImageSize));
    this.lastVisibleLocalY  = defs.clampLocalY(Math.floor((this.scrollTop + this.canvas.clientHeight - 1) / this.easedImageSize));
    this.firstVisibleGroupX = Math.floor(this.firstVisibleLocalX / this.groupCount) * this.groupCount;
    this.lastVisibleGroupX  = Math.floor(this.lastVisibleLocalX / this.groupCount) * this.groupCount;
    this.firstVisibleGroupY = Math.floor(this.firstVisibleLocalY / this.groupCount) * this.groupCount;
    this.lastVisibleGroupY  = Math.floor(this.lastVisibleLocalY / this.groupCount) * this.groupCount;
  },

  exportScrollPosition: function () {
    this.node.scrollLeft = Math.floor(this.easedSignalLeft * this.easedWidth);
    this.node.scrollTop  = Math.floor(this.easedSignalTop * this.easedHeight);
  },

  onDoubleClick: function (event) {
    // console.log("doubleClick", event.clientX, event.clientY);
    var delay = !event.shiftKey ? 500 : 2500;
    var left = (this.scrollLeft + event.clientX) / this.easedWidth;
    var top  = (this.scrollTop + event.clientY) / this.easedHeight;
    this.easeSignalLeft(Math.max(0, Math.min(left, 1)), delay);
    this.easeSignalTop(Math.max(0, Math.min(top, 1)), delay);
    if (!event.altKey) {
      this.easeZoomPower(Math.max(0, this.state.zoomPower - 1), delay);
    } else {
      this.easeZoomPower(Math.min(this.state.zoomPower + 1, defs.maxZoomPower), delay);
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
