"use strict";

var GeometryLoader = require("./geometry-loader");
var Painter = require("./painter");
var Renderer = require("./renderer");

var r = require("react-wrapper");
var defs = require("./defs");
var easeStateMixin = require("./ease-state-mixin");


function computeTimeSignal(rawTimeSignal) {
  return (
    rawTimeSignal >= 0 ?
      Math.round((rawTimeSignal * 3600) % (24 * 3600)) / 3600 :
      24 - Math.round((-rawTimeSignal * 3600) % (24 * 3600)) / 3600);
}

function computeTimeSlice(time) {
  return (
    (time >=  8 && time < 10) ? 1 :
    (time >= 10 && time < 13) ? 2 :
    (time >= 13 && time < 16) ? 3 :
    (time >= 16 && time < 19) ? 4 :
    (time >= 19 && time < 21) ? 5 :
    0);
}


module.exports = {
  mixins: [
    easeStateMixin
  ],

  getInitialState: function () {
    return {
      leftSignal: 0.4897637424698795,
      topSignal: 0.4768826844262295,
      rawTimeSignal: 10 + 9 / 60,
      zoomSignal: 4
    };
  },

  easeSignalLeft: function (leftSignal, duration) {
    this.easingSignalLeft = true;
    this.easeState("leftSignal", leftSignal, duration, function () {
        this.easingSignalLeft = false;
      }.bind(this));
  },
 
  easeSignalTop: function (topSignal, duration) {
    this.easingSignalTop = true;
    this.easeState("topSignal", topSignal, duration, function () {
        this.easingSignalTop = false;
      }.bind(this));
  },

  easeTimeSignal: function (rawTimeSignal, duration) {
    this.easingRawTimeSignal = true;
    this.easeState("rawTimeSignal", rawTimeSignal, duration, function () {
        this.easingRawTimeSignal = false;
      }.bind(this));
  },

  easeZoomSignal: function (zoomSignal, duration) {
    this.easingZoomSignal = true;
    this.easeState("zoomSignal", zoomSignal, duration, function () {
        this.easingZoomSignal = false;
      }.bind(this));
  },


  _updateLoader: function () {
    this._geometryLoader.update(this.easedSignalLeft, this.easedSignalTop);
  },

  _updateRenderer: function () {
    this._renderer.update({
        floorTimeSignal:         this.floorTimeSignal,
        floorZoomSignal:         this.floorZoomSignal,
      
        localXSignal:        this.localXSignal,
        localYSignal:        this.localYSignal,
        firstVisibleLocalX:     this.firstVisibleLocalX,
        lastVisibleLocalX:      this.lastVisibleLocalX,
        firstVisibleLocalY:     this.firstVisibleLocalY,
        lastVisibleLocalY:      this.lastVisibleLocalY
      });
  },
  
  _updatePainter: function () {
    this._painter.update({
        floorTimeSignal:     this.floorTimeSignal,
      
        scrollLeft:         this.scrollLeft,
        scrollTop:          this.scrollTop,
      
        canvas:             this.canvas,
        roundZoomSignal:     this.roundZoomSignal,
        easedZoomSignal:     this.easedZoomSignal,
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
    if (!this.easingSignalLeft && !this.easingSignalTop && !this.easingZoomSignal) {
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
    this.easedSignalLeft = this.getEasedState("leftSignal");
    this.easedSignalTop  = this.getEasedState("topSignal");
    this.easedTimeSignal     = computeTimeSignal(this.getEasedState("rawTimeSignal"));
    this.easedZoomSignal     = this.getEasedState("zoomSignal");
    this.floorTimeSignal    = Math.floor(this.easedTimeSignal);
    this.timeSlice          = computeTimeSlice(this.floorTimeSignal);
    this.floorZoomSignal    = Math.floor(this.easedZoomSignal);
    this.roundZoomSignal     = Math.round(this.easedZoomSignal);
    this.ceilZoomSignal      = Math.ceil(this.easedZoomSignal);
    this.easedZoomLevel     = Math.pow(2, this.easedZoomSignal);
    this.easedImageSize     = defs.imageSize / this.easedZoomLevel;
    this.groupCount         = Math.pow(2, this.roundZoomSignal);
    this.groupSize          = defs.imageSize * this.groupCount;
    this.easedWidth         = defs.tileXCount * this.easedImageSize;
    this.easedHeight        = defs.tileYCount * this.easedImageSize;
    
    this.scrollLeft         = Math.floor(this.easedSignalLeft * this.easedWidth - this.canvas.clientWidth / 2);
    this.scrollTop          = Math.floor(this.easedSignalTop * this.easedHeight - this.canvas.clientHeight / 2);
    this.localXSignal    = Math.floor(this.easedSignalLeft * defs.tileXCount);
    this.localYSignal    = Math.floor(this.easedSignalTop * defs.tileYCount);
    
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
      this.easeZoomSignal(Math.max(0, this.state.zoomSignal - 1), delay);
    } else {
      this.easeZoomSignal(Math.min(this.state.zoomSignal + 1, defs.maxZoomSignal), delay);
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
