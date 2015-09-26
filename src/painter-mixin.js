"use strict";

var defs = require("./defs");
var iid = require("./image-id");


module.exports = {
  paintTileBorders: function (c) {
    var easedZoomPower = this.getEasedZoomPower();
    var easedZoomLevel = Math.pow(2, easedZoomPower);
    var easedImageSize = defs.imageSize / easedZoomLevel;
    var easedTextSize  = 4 * Math.sqrt(easedZoomLevel);
    var scrollLeft = this.getEasedAttentionLeft() * defs.tileXCount * easedImageSize - this.state.clientWidth / 2;
    var scrollTop  = this.getEasedAttentionTop() * defs.tileYCount * easedImageSize - this.state.clientHeight / 2;
    c.translate(-scrollLeft + 0.25, -scrollTop + 0.25);
    c.scale(1 / easedZoomLevel, 1 / easedZoomLevel);
    c.lineWidth = 0.5 * easedZoomLevel;
    c.fillStyle = c.strokeStyle = this.props.borderColor;
    c.font = 24 * Math.sqrt(easedZoomLevel) + "px " + this.props.borderFont;
    c.textAlign = "left";
    c.textBaseline = "top";
    for (var lx = this.firstVisibleLocalX; lx <= this.lastVisibleLocalX; lx++) {
      var tx  = defs.localToTileX(lx);
      var ldx = lx * defs.imageSize;
      for (var ly = this.firstVisibleLocalY; ly <= this.lastVisibleLocalY; ly++) {
        var ty  = defs.localToTileY(ly);
        var ldy = ly * defs.imageSize;
        if (easedZoomPower < 3) {
          c.globalAlpha = 1 - (easedZoomPower - 2);
          c.fillText(tx + "×" + ty, ldx + easedTextSize, ldy);
          c.globalAlpha = 1;
        }
        c.strokeRect(ldx, ldy, defs.imageSize, defs.imageSize);
      }
    }
  },

  paintTileContents: function (c) {
    var easedZoomPower = this.getEasedZoomPower();
    var easedZoomLevel = Math.pow(2, easedZoomPower);
    var easedImageSize = defs.imageSize / easedZoomLevel;
    var scrollLeft = this.getEasedAttentionLeft() * defs.tileXCount * easedImageSize - this.state.clientWidth / 2;
    var scrollTop  = this.getEasedAttentionTop() * defs.tileYCount * easedImageSize - this.state.clientHeight / 2;
    c.translate(-scrollLeft, -scrollTop);
    c.scale(1 / easedZoomLevel, -1 / easedZoomLevel);
    c.translate(0, -defs.tileYCount * defs.imageSize);
    var zoomPower  = Math.round(easedZoomPower);
    var groupCount = Math.pow(2, zoomPower);
    var groupSize  = defs.imageSize * groupCount;
    var firstVisibleGroupTileX = Math.floor(this.firstVisibleTileX / groupCount) * groupCount;
    var lastVisibleGroupTileX  = Math.floor(this.lastVisibleTileX / groupCount) * groupCount;
    var firstVisibleGroupTileY = Math.floor(this.firstVisibleTileY / groupCount) * groupCount;
    var lastVisibleGroupTileY  = Math.floor(this.lastVisibleTileY / groupCount) * groupCount;
    for (var gtx = firstVisibleGroupTileX; gtx <= lastVisibleGroupTileX; gtx += groupCount) {
      var glx  = defs.tileToLocalX(gtx);
      var gldx = glx * defs.imageSize;
      for (var gty = firstVisibleGroupTileY; gty <= lastVisibleGroupTileY; gty += groupCount) {
        var gly  = defs.tileToLocalY(gty);
        var gldy = (defs.tileYCount - gly - 1) * defs.imageSize;
        var groupId = new iid.ImageId(glx, gly, zoomPower);
        var canvas = this.getRenderedGroup(groupId);
        if (canvas) {
          c.drawImage(canvas, gldx, gldy, groupSize, groupSize);
        }
      }
    }
  },

  paintNow: function () {
    var width  = window.devicePixelRatio * this.state.clientWidth;
    var height = window.devicePixelRatio * this.state.clientHeight;
    var canvas = this.canvas;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
    }
    var c = canvas.getContext("2d", {alpha: false});
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.scale(window.devicePixelRatio, window.devicePixelRatio);
    c.save();
    c.fillStyle = this.props.backgroundColor;
    c.fillRect(0, 0, this.state.clientWidth, this.state.clientHeight);
    this.paintTileBorders(c);
    c.restore();
    c.save();
    this.paintTileContents(c);
    c.restore();
    if (this.state.invertColor) {
      c.globalCompositeOperation = "difference";
      c.fillStyle = "#fff";
      c.fillRect(0, 0, this.state.clientWidth, this.state.clientHeight);
      c.globalCompositeOperation = "source-over";
    }
    this.pendingPaint = false;
  },

  paint: function () {
    if (!this.pendingPaint) {
      this.pendingPaint = true;
      window.requestAnimationFrame(this.paintNow);
    }
  }
};
