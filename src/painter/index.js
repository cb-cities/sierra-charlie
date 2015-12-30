"use strict";

var nnng = require("nnng");
var compute = require("../compute");
var defs = require("../defs");
var iid = require("../lib/image-id");


function _paintTileLabels(c, zoom, firstVisibleLocalX, firstVisibleLocalY, lastVisibleLocalX, lastVisibleLocalY) {
  var textMargin = compute.textMargin(zoom);
  c.fillStyle = defs.labelColor;
  c.font = 32 + "px " + defs.labelFont;
  c.textAlign = "left";
  c.textBaseline = "top";
  for (var lx = firstVisibleLocalX; lx <= lastVisibleLocalX; lx++) {
    var ldx = lx * defs.imageSize;
    var tx = defs.localToTileX(lx);
    var ngx = defs.localToNationalGridX(lx);
    for (var ly = firstVisibleLocalY; ly <= lastVisibleLocalY; ly++) {
      var ldy = ly * defs.imageSize;
      var ty = defs.localToTileY(ly);
      var ngy = defs.localToNationalGridY(ly);
      var latLon = nnng.from(ngx, ngy);
      var lat = latLon[0].toFixed(6);
      var lon = latLon[1].toFixed(6);
      c.fillText(tx + "n," + ty + "e (" + lat + "°N," + lon + "°E)", ldx + textMargin, ldy);
    }
  }
}


function Painter(canvas, props) {
  this._canvas = canvas;
  this._props = props;
  this._tileBordersPath = null;
  this._pendingPaint = true;
  
  requestAnimationFrame(this._paint.bind(this));
}

Painter.prototype = {
  _paintTileBorders: function (c, zoom) {
    if (!this._tileBordersPath) {
      var path = new Path2D();
      path.moveTo(0, 0);
      path.lineTo(0, defs.maxHeight);
      for (var lx = 1; lx <= defs.tileXCount; lx++) {
        var ldx = lx * defs.imageSize;
        path.moveTo(ldx, 0);
        path.lineTo(ldx, defs.maxHeight);
      }
      path.moveTo(0, 0);
      path.lineTo(defs.maxWidth, 0);
      for (var ly = 1; ly <= defs.tileYCount; ly++) {
        var ldy = ly * defs.imageSize;
        path.moveTo(0, ldy);
        path.lineTo(defs.maxWidth, ldy);
      }
      this._tileBordersPath = path;
    }
    c.lineWidth = compute.tileBorderLineWidth(zoom);
    c.strokeStyle = defs.borderColor;
    c.stroke(this._tileBordersPath);
  },

  _paintTileContents: function (c, time, zoom, firstVisibleLocalX, firstVisibleLocalY, lastVisibleLocalX, lastVisibleLocalY) {
    var groupCount         = compute.groupCount(zoom);
    var groupSize          = defs.imageSize * groupCount;
    var firstVisibleGroupX = Math.floor(firstVisibleLocalX / groupCount) * groupCount;
    var firstVisibleGroupY = Math.floor(firstVisibleLocalY / groupCount) * groupCount;
    var lastVisibleGroupX  = Math.floor(lastVisibleLocalX / groupCount) * groupCount;
    var lastVisibleGroupY  = Math.floor(lastVisibleLocalY / groupCount) * groupCount;
    for (var gx = firstVisibleGroupX; gx <= lastVisibleGroupX; gx += groupCount) {
      var gdx = gx * defs.imageSize;
      for (var gy = firstVisibleGroupY; gy <= lastVisibleGroupY; gy += groupCount) {
        var gdy = gy * defs.imageSize;
        var groupId = iid.fromLocal(gx, gy, Math.floor(time), Math.round(zoom));
        var canvas = this._props.getRenderedGroup(groupId);
        if (canvas) {
          c.drawImage(canvas, gdx, gdy, groupSize, groupSize);
        }
      }
    }
  },
  
  _paintCanvas: function (canvas, state, devicePixelRatio) {
    var c = canvas.getContext("2d", {
        alpha: false
      });
    c.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    c.save();
    c.fillStyle = defs.backgroundColor;
    c.fillRect(0, 0, state.width, state.height);
    var scrollLeft = compute.scrollLeft(state.width, state.left, state.zoom);
    var scrollTop  = compute.scrollTop(state.height, state.top, state.zoom);
    c.translate(-scrollLeft, -scrollTop);
    c.translate(0.5 / devicePixelRatio, 0.5 / devicePixelRatio);
    var scaleRatio = compute.scaleRatio(state.zoom);
    c.scale(scaleRatio, scaleRatio);
    var firstVisibleLocalX = compute.firstVisibleLocalX(state.width, state.left, state.zoom);
    var firstVisibleLocalY = compute.firstVisibleLocalY(state.height, state.top, state.zoom);
    var lastVisibleLocalX  = compute.lastVisibleLocalX(state.width, state.left, state.zoom);
    var lastVisibleLocalY  = compute.lastVisibleLocalY(state.height, state.top, state.zoom);
    if (state.zoom < 3) {
      c.globalAlpha = 1 - (state.zoom - 2);
      _paintTileLabels(c, state.zoom, firstVisibleLocalX, firstVisibleLocalY, lastVisibleLocalX, lastVisibleLocalY);
      c.globalAlpha = 1;
    }
    this._paintTileBorders(c, state.zoom);
    c.restore();
    c.save();
    c.translate(-scrollLeft, -scrollTop);
    c.scale(scaleRatio, scaleRatio);
    this._paintTileContents(c, state.time, state.zoom, firstVisibleLocalX, firstVisibleLocalY, lastVisibleLocalX, lastVisibleLocalY);
    c.restore();
    c.save();
    c.translate(0.5 / devicePixelRatio, 0.5 / devicePixelRatio);
  },

  _paint: function () {
    requestAnimationFrame(this._paint.bind(this));
    
    var canvas = this._canvas;
    var state  = this._props.getDerivedState();
    var devicePixelRatio = window.devicePixelRatio;
    var deviceWidth      = devicePixelRatio * state.width;
    var deviceHeight     = devicePixelRatio * state.height;
    if (canvas.width !== deviceWidth || canvas.height !== deviceHeight) {
      canvas.width  = deviceWidth;
      canvas.height = deviceHeight;
      this._pendingPaint = true;
    }
    
    if (this._pendingPaint) {
      this._pendingPaint = false;
      this._paintCanvas(canvas, state, devicePixelRatio);
    }
  },

  update: function () {
    this._pendingPaint = true;
  }
};

module.exports = Painter;
