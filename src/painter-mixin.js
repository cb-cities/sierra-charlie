"use strict";

/* global Path2D */

var nnng = require("nnng");
var defs = require("./defs");
var iid = require("./image-id");


module.exports = {
  paintClockFace: function (c) {
    c.beginPath();
    c.arc(0, 0, defs.clockSize, 0, 2 * Math.PI);
    c.globalAlpha = 0.75;
    c.fill();
    c.globalAlpha = 1;
    c.lineWidth = 1 / window.devicePixelRatio;
    c.stroke();
  },

  paintClockBrand: function (c) {
    c.font = 3 + "px " + defs.labelFont;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("SIERRA CHARLIE", 0, -(defs.clockSize / 2));
  },

  paintClockAmPmLabel: function (c) {
    c.font = 9 + "px " + defs.labelFont;
    c.textAlign = "right";
    c.fillText(this.easedTimeValue < 12 ? "AM" : "PM", defs.clockSize - 20, 0);
  },

  paintClockMinuteMarks: function (c) {
    c.save();
    c.beginPath();
    for (var i = 0; i < 60; i++) {
      c.moveTo(defs.clockSize - 8, 0);
      c.lineTo(defs.clockSize - 4, 0);
      c.rotate(2 * Math.PI / 60);
    }
    c.lineWidth = 1.5;
    c.stroke();
    c.restore();
  },

  paintClockHourMarks: function (c) {
    c.save();
    c.beginPath();
    for (var i = 0; i < 12; i++) {
      c.moveTo(defs.clockSize - 16, 0);
      c.lineTo(defs.clockSize - 4, 0);
      c.rotate(2 * Math.PI / 12);
    }
    c.lineWidth = 3;
    c.stroke();
    c.restore();
  },

  paintClockHourHand: function (c) {
    c.save();
    c.rotate(this.easedTimeValue * (2 * Math.PI / 12));
    c.beginPath();
    c.moveTo(0, 16);
    c.lineTo(0, -(defs.clockSize - 20));
    c.lineWidth = 6;
    c.stroke();
    c.restore();
  },

  paintClockMinuteHand: function (c) {
    c.save();
    c.rotate((this.easedTimeValue - this.floorTimeValue) * 2 * Math.PI);
    c.beginPath();
    c.moveTo(0, 14);
    c.lineTo(0, -(defs.clockSize - 4));
    c.lineWidth = 4.5;
    c.stroke();
    c.restore();
  },

  paintClock: function (c) {
    c.save();
    c.fillStyle = defs.backgroundColor;
    c.strokeStyle = defs.borderColor;
    c.translate(this.state.clientWidth / 2, defs.clockSize + 8);
    this.paintClockFace(c);
    c.fillStyle = defs.inverseBackgroundColor;
    c.strokeStyle = defs.inverseBackgroundColor;
    this.paintClockBrand(c);
    this.paintClockAmPmLabel(c);
    this.paintClockHourMarks(c);
    this.paintClockMinuteMarks(c);
    this.paintClockHourHand(c);
    this.paintClockMinuteHand(c);
    c.restore();
  },

  paintTileBorders: function (c) {
    if (!this.tileBordersPath) {
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
      this.tileBordersPath = path;
    }
    c.lineWidth = this.easedZoomLevel / window.devicePixelRatio;
    c.strokeStyle = defs.borderColor;
    c.stroke(this.tileBordersPath);
  },

  paintTileLabels: function (c) {
    var easedTextMargin = 4 * Math.sqrt(this.easedZoomLevel);
    c.fillStyle = defs.labelColor;
    c.font = 32 + "px " + defs.labelFont;
    c.textAlign = "left";
    c.textBaseline = "top";
    for (var lx = this.firstVisibleLocalX; lx <= this.lastVisibleLocalX; lx++) {
      var ldx = lx * defs.imageSize;
      var ngx = defs.localToNationalGridX(lx);
      for (var ly = this.firstVisibleLocalY; ly <= this.lastVisibleLocalY; ly++) {
        var ldy = ly * defs.imageSize;
        var ngy = defs.localToNationalGridY(ly);
        var latLon = nnng.from(ngx, ngy);
        var lat = latLon[0].toFixed(6);
        var lon = latLon[1].toFixed(6);
        c.fillText(ngx + "N," + ngy + "E (" + lat + "°N," + lon + "°E)", ldx + easedTextMargin, ldy);
      }
    }
  },

  paintTileContents: function (c) {
    for (var gx = this.firstVisibleGroupX; gx <= this.lastVisibleGroupX; gx += this.groupCount) {
      var gdx = gx * defs.imageSize;
      for (var gy = this.firstVisibleGroupY; gy <= this.lastVisibleGroupY; gy += this.groupCount) {
        var gdy = gy * defs.imageSize;
        var beforeGroupId = iid.fromLocal(gx, gy, this.floorTimeValue, this.roundZoomPower);
        var beforeGroup = this.getRenderedGroup(beforeGroupId);
        if (beforeGroup) {
          c.globalAlpha = 1 / 3 + (1 - (this.easedTimeValue - this.floorTimeValue)) * (2 / 3);
          c.drawImage(beforeGroup, gdx, gdy, this.groupSize, this.groupSize);
          c.globalAlpha = 1;
        }
        if (this.floorTimeValue !== this.ceilTimeValue) {
          var afterGroupId = iid.fromLocal(gx, gy, this.ceilTimeValue, this.roundZoomPower);
          var afterGroup = this.getRenderedGroup(afterGroupId);
          if (afterGroup) {
            c.globalAlpha = 1 / 3 + (1 - (this.ceilTimeValue - this.easedTimeValue)) * (2 / 3);
            c.drawImage(afterGroup, gdx, gdy, this.groupSize, this.groupSize);
            c.globalAlpha = 1;
          }
        }
      }
    }
  },

  paint: function () {
    var width  = window.devicePixelRatio * this.state.clientWidth;
    var height = window.devicePixelRatio * this.state.clientHeight;
    var canvas = this.canvas;
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
    c.fillRect(0, 0, this.state.clientWidth, this.state.clientHeight);
    c.translate(-this.scrollLeft, -this.scrollTop);
    c.translate(0.5 / window.devicePixelRatio, 0.5 / window.devicePixelRatio);
    c.scale(1 / this.easedZoomLevel, 1 / this.easedZoomLevel);
    if (this.easedZoomPower < 3) {
      c.globalAlpha = 1 - (this.easedZoomPower - 2);
      this.paintTileLabels(c, this.easedZoomLevel);
      c.globalAlpha = 1;
    }
    this.paintTileBorders(c);
    c.restore();
    c.save();
    c.translate(-this.scrollLeft, -this.scrollTop);
    c.scale(1 / this.easedZoomLevel, 1 / this.easedZoomLevel);
    this.paintTileContents(c);
    c.restore();
    c.save();
    c.translate(0.5 / window.devicePixelRatio, 0.5 / window.devicePixelRatio);
    this.paintClock(c);
    if (this.state.invertColor) {
      c.restore();
      c.globalCompositeOperation = "difference";
      c.fillStyle = "#fff";
      c.fillRect(0, 0, this.state.clientWidth, this.state.clientHeight);
      c.globalCompositeOperation = "source-over";
    }
    this.pendingPaint = false;
  },

  requestPainting: function () {
    if (!this.pendingPaint) {
      this.pendingPaint = true;
      window.requestAnimationFrame(this.paint);
    }
  }
};
