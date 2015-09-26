"use strict";

var iid = require("./image-id");


module.exports = {
  paintTileBorders: function (c) {
    var easedZoomPower = this.getEasedZoomPower();
    var easedZoomLevel = Math.pow(2, easedZoomPower);
    var easedImageSize = this.props.imageSize / easedZoomLevel;
    var easedTextSize  = 4 * Math.sqrt(easedZoomLevel);
    var scrollLeft = this.getEasedAttentionLeft() * this.props.tileXCount * easedImageSize - this.state.clientWidth / 2;
    var scrollTop  = this.getEasedAttentionTop() * this.props.tileYCount * easedImageSize - this.state.clientHeight / 2;
    c.translate(-scrollLeft + 0.25, -scrollTop + 0.25);
    c.scale(1 / easedZoomLevel, 1 / easedZoomLevel);
    c.lineWidth = 0.5 * easedZoomLevel;
    c.fillStyle = c.strokeStyle = this.props.borderColor;
    c.font = 24 * Math.sqrt(easedZoomLevel) + "px " + this.props.borderFont;
    c.textAlign = "left";
    c.textBaseline = "top";
    for (var lx = this.firstVisibleLocalX; lx <= this.lastVisibleLocalX; lx++) {
      var tx  = this.localToTileX(lx);
      var ldx = lx * this.props.imageSize;
      for (var ly = this.firstVisibleLocalY; ly <= this.lastVisibleLocalY; ly++) {
        var ty  = this.localToTileY(ly);
        var ldy = ly * this.props.imageSize;
        if (easedZoomPower < 3) {
          c.globalAlpha = 1 - (easedZoomPower - 2);
          c.fillText(tx + "×" + ty, ldx + easedTextSize, ldy);
          c.globalAlpha = 1;
        }
        c.strokeRect(ldx, ldy, this.props.imageSize, this.props.imageSize);
      }
    }
  },

  paintTileContents: function (c) {
    var easedZoomPower = this.getEasedZoomPower();
    var easedZoomLevel = Math.pow(2, easedZoomPower);
    var easedImageSize = this.props.imageSize / easedZoomLevel;
    var scrollLeft = this.getEasedAttentionLeft() * this.props.tileXCount * easedImageSize - this.state.clientWidth / 2;
    var scrollTop  = this.getEasedAttentionTop() * this.props.tileYCount * easedImageSize - this.state.clientHeight / 2;
    c.translate(-scrollLeft, -scrollTop);
    c.scale(1 / easedZoomLevel, -1 / easedZoomLevel);
    c.translate(0, -this.props.tileYCount * this.props.imageSize);
    var zoomPower  = Math.round(easedZoomPower);
    var groupCount = Math.pow(2, zoomPower);
    var groupSize  = this.props.imageSize * groupCount;
    var firstVisibleGroupTileX = Math.floor(this.firstVisibleTileX / groupCount) * groupCount;
    var lastVisibleGroupTileX  = Math.floor(this.lastVisibleTileX / groupCount) * groupCount;
    var firstVisibleGroupTileY = Math.floor(this.firstVisibleTileY / groupCount) * groupCount;
    var lastVisibleGroupTileY  = Math.floor(this.lastVisibleTileY / groupCount) * groupCount;
    for (var gtx = firstVisibleGroupTileX; gtx <= lastVisibleGroupTileX; gtx += groupCount) {
      var glx  = this.tileToLocalX(gtx);
      var gldx = glx * this.props.imageSize;
      for (var gty = firstVisibleGroupTileY; gty <= lastVisibleGroupTileY; gty += groupCount) {
        var gly  = this.tileToLocalY(gty);
        var gldy = (this.props.tileYCount - gly - 1) * this.props.imageSize;
        var groupId = new iid.ImageId(gtx, gty, zoomPower);
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
