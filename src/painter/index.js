"use strict";

/* global Path2D */

var nnng = require("nnng");
var defs = require("../defs");
var iid = require("../lib/image-id");
var tmp = require("../tmp");


function _paintTileLabels(c, easedZoom, firstVisibleLocalX, firstVisibleLocalY, lastVisibleLocalX, lastVisibleLocalY) {
  var easedTextMargin = tmp.computeTextMargin(easedZoom);
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
      c.fillText(tx + "n," + ty + "e (" + lat + "°N," + lon + "°E)", ldx + easedTextMargin, ldy);
    }
  }
}


function Painter(callbacks) {
  this._callbacks = callbacks;
  this._tileBordersPath = null;
  this._pendingPaint = false;
}

Painter.prototype = {
  _paintTileBorders: function (c, easedZoom) {
    if (!this._tileBordersPath) {
      var path = new Path2D();
      path.moveTo(0, 0);
      path.lineTo(0, defs.height);
      for (var lx = 1; lx <= defs.tileXCount; lx++) {
        var ldx = lx * defs.imageSize;
        path.moveTo(ldx, 0);
        path.lineTo(ldx, defs.height);
      }
      path.moveTo(0, 0);
      path.lineTo(defs.width, 0);
      for (var ly = 1; ly <= defs.tileYCount; ly++) {
        var ldy = ly * defs.imageSize;
        path.moveTo(0, ldy);
        path.lineTo(defs.width, ldy);
      }
      this._tileBordersPath = path;
    }
    c.lineWidth = tmp.computeTileBorderLineWidth(easedZoom);
    c.strokeStyle = defs.borderColor;
    c.stroke(this._tileBordersPath);
  },

  _paintTileContents: function (c, easedTime, easedZoom, firstVisibleGroupX, firstVisibleGroupY, lastVisibleGroupX, lastVisibleGroupY) {
    var groupCount = tmp.computeGroupCount(easedZoom);
    var groupSize  = defs.imageSize * groupCount;
    for (var gx = firstVisibleGroupX; gx <= lastVisibleGroupX; gx += groupCount) {
      var gdx = gx * defs.imageSize;
      for (var gy = firstVisibleGroupY; gy <= lastVisibleGroupY; gy += groupCount) {
        var gdy = gy * defs.imageSize;
        var groupId = iid.fromLocal(gx, gy, Math.floor(easedTime), Math.round(easedZoom));
        var canvas = this._callbacks.getRenderedGroup(groupId);
        if (canvas) {
          c.drawImage(canvas, gdx, gdy, groupSize, groupSize);
        }
      }
    }
  },

  _paint: function (state) {
    var canvas = state.canvas;
    var width  = window.devicePixelRatio * canvas.clientWidth;
    var height = window.devicePixelRatio * canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
    }
    var c = canvas.getContext("2d", {
        alpha: false
      });
    c.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    c.save();
    c.fillStyle = defs.backgroundColor;
    c.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    c.translate(-state.scrollLeftSignal, -state.scrollTopSignal);
    c.translate(0.5 / window.devicePixelRatio, 0.5 / window.devicePixelRatio);
    var scaleRatio = tmp.computeScaleRatio(state.easedZoomSignal);
    c.scale(scaleRatio, scaleRatio);
    if (state.easedZoomSignal < 3) {
      c.globalAlpha = 1 - (state.easedZoomSignal - 2);
      _paintTileLabels(c, state.easedZoomSignal, state.firstVisibleLocalXSignal, state.firstVisibleLocalYSignal, state.lastVisibleLocalXSignal, state.lastVisibleLocalYSignal);
      c.globalAlpha = 1;
    }
    this._paintTileBorders(c, state.easedZoomSignal);
    c.restore();
    c.save();
    c.translate(-state.scrollLeftSignal, -state.scrollTopSignal);
    c.scale(scaleRatio, scaleRatio);
    this._paintTileContents(c, state.easedTimeSignal, state.easedZoomSignal, state.firstVisibleGroupX, state.firstVisibleGroupY, state.lastVisibleGroupX, state.lastVisibleGroupY);
    c.restore();
    c.save();
    c.translate(0.5 / window.devicePixelRatio, 0.5 / window.devicePixelRatio);
    this._pendingPaint = false;
  },

  update: function (state) {
    if (!this._pendingPaint) {
      this._pendingPaint = true;
      window.requestAnimationFrame(function () {
          this._paint(state);
        }.bind(this));
    }
  }
};

module.exports = Painter;
