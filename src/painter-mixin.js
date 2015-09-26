"use strict";

var ImageId = require("./image-id");


module.exports = {
  paintTileBorders: function (c) {
    var zoomPower  = this.getEasedZoomPower();
    var zoomLevel  = Math.pow(2, zoomPower);
    var imageSize  = this.props.imageSize / zoomLevel;
    var scrollLeft = this.getEasedAttentionLeft() * this.props.tileXCount * imageSize - this.state.clientWidth / 2;
    var scrollTop  = this.getEasedAttentionTop() * this.props.tileYCount * imageSize - this.state.clientHeight / 2;
    c.translate(-scrollLeft + 0.25, -scrollTop + 0.25);
    c.scale(1 / zoomLevel, 1 / zoomLevel);
    c.lineWidth = 0.5 * zoomLevel;
    c.fillStyle = c.strokeStyle = this.props.borderColor;
    c.font = 24 * Math.sqrt(zoomLevel) + "px " + this.props.borderFont;
    c.textAlign = "left";
    c.textBaseline = "top";
    for (var lx = this.firstVisibleLocalX; lx <= this.lastVisibleLocalX; lx++) {
      for (var ly = this.firstVisibleLocalY; ly <= this.lastVisibleLocalY; ly++) {
        var tx = this.localToTileX(lx);
        var ty = this.localToTileY(ly);
        if (zoomPower < 3) {
          c.globalAlpha = 1 - (zoomPower - 2);
          c.fillText(tx + "×" + ty, lx * this.props.imageSize + 4 * Math.sqrt(zoomLevel), ly * this.props.imageSize);
          c.globalAlpha = 1;
        }
        c.strokeRect(lx * this.props.imageSize, ly * this.props.imageSize, this.props.imageSize, this.props.imageSize);
      }
    }
  },

  paintTileContents: function (c) {
    var zoomPower  = this.getEasedZoomPower();
    var roundPower = Math.round(zoomPower);
    var zoomLevel  = Math.pow(2, zoomPower);
    var groupCount = Math.pow(2, roundPower);
    var imageSize  = this.props.imageSize / zoomLevel;
    var groupSize  = this.props.imageSize * groupCount;
    var scrollLeft = this.getEasedAttentionLeft() * this.props.tileXCount * imageSize - this.state.clientWidth / 2;
    var scrollTop  = this.getEasedAttentionTop() * this.props.tileYCount * imageSize - this.state.clientHeight / 2;
    c.translate(-scrollLeft, -scrollTop);
    c.scale(1 / zoomLevel, -1 / zoomLevel);
    c.translate(0, -this.props.tileYCount * this.props.imageSize);
    var firstVisibleGroupTileX = Math.floor(this.firstVisibleTileX / groupCount) * groupCount;
    var lastVisibleGroupTileX  = Math.floor(this.lastVisibleTileX / groupCount) * groupCount;
    var firstVisibleGroupTileY = Math.floor(this.firstVisibleTileY / groupCount) * groupCount;
    var lastVisibleGroupTileY  = Math.floor(this.lastVisibleTileY / groupCount) * groupCount;
    for (var gtx = firstVisibleGroupTileX; gtx <= lastVisibleGroupTileX; gtx += groupCount) {
      for (var gty = firstVisibleGroupTileY; gty <= lastVisibleGroupTileY; gty += groupCount) {
        var glx = this.tileToLocalX(gtx);
        var gly = this.tileToLocalY(gty);
        var groupId = new ImageId(gtx, gty, roundPower);
        var canvas = this.getRenderedGroup(groupId);
        if (canvas) {
          c.drawImage(canvas, glx * this.props.imageSize, (this.props.tileYCount - gly - 1) * this.props.imageSize, groupSize, groupSize);
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
