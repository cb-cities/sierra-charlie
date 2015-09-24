"use strict";

var ImageId = require("./image-id");


function computeZoomLevel(zoomPower) {
  return Math.pow(2, zoomPower);
}


module.exports = {
  paint: function () {
    if (!this.pendingPaint) {
      this.pendingPaint = true;
      this.storedZoomPower = this.getZoomPower();
      window.requestAnimationFrame(this.paintNow);
    }
  },

  paintNow: function () {
    var width  = window.devicePixelRatio * this.clientWidth;
    var height = window.devicePixelRatio * this.clientHeight;
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
    c.fillRect(0, 0, this.clientWidth, this.clientHeight);
    this.paintTileBorders(c);
    c.restore();
    c.save();
    this.paintTileContents(c);
    c.restore();
    if (this.state.invertColor) {
      c.globalCompositeOperation = "difference";
      c.fillStyle = "#fff";
      c.fillRect(0, 0, this.clientWidth, this.clientHeight);
      c.globalCompositeOperation = "source-over";
    }
    this.pendingPaint = false;
  },

  paintTileBorders: function (c) {
    var zoomPower  = this.storedZoomPower;
    var zoomLevel  = computeZoomLevel(zoomPower);
    var imageSize  = this.props.imageSize / zoomLevel;
    var scrollLeft = this.attentionLeft * this.getTileXCount() * imageSize - this.clientWidth / 2;
    var scrollTop  = this.attentionTop * this.getTileYCount() * imageSize - this.clientHeight / 2;
    c.translate(-scrollLeft + 0.25, -scrollTop + 0.25);
    c.scale(1 / zoomLevel, 1 / zoomLevel);
    c.lineWidth = 0.5 * zoomLevel;
    c.fillStyle = c.strokeStyle = this.props.borderColor;
    c.font = 24 * Math.sqrt(zoomLevel) + "px " + this.props.borderFont;
    c.textAlign = "left";
    c.textBaseline = "top";
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
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

  getApproximateImage: function (lx, ly, zoomPower) {
    var tx = this.localToTileX(lx);
    var ty = this.localToTileY(ly);
    for (var tz = Math.round(zoomPower); tz >= 0; tz--) {
      var imageId = new ImageId(tx, ty, tz);
      var imageData = this.getRenderedImage(imageId);
      if (imageData) {
        return imageData;
      }
    }
    for (var tz = Math.round(zoomPower); tz <= this.props.maxZoomPower; tz++) {
      var imageId = new ImageId(tx, ty, tz);
      var imageData = this.getRenderedImage(imageId);
      if (imageData) {
        return imageData;
      }
    }
    return null;
  },

  paintTileContents: function (c) {
    var zoomPower  = this.storedZoomPower;
    var zoomLevel  = computeZoomLevel(zoomPower);
    var imageSize  = this.props.imageSize / zoomLevel;
    var scrollLeft = this.attentionLeft * this.getTileXCount() * imageSize - this.clientWidth / 2;
    var scrollTop  = this.attentionTop * this.getTileYCount() * imageSize - this.clientHeight / 2;
    c.translate(-scrollLeft, -scrollTop);
    c.scale(1 / zoomLevel, -1 / zoomLevel);
    c.translate(0, -this.getTileYCount() * this.props.imageSize);
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
        var imageData = this.getApproximateImage(lx, ly, zoomPower);
        if (imageData) {
          c.drawImage(imageData, lx * this.props.imageSize, (this.getTileYCount() - ly - 1) * this.props.imageSize, this.props.imageSize, this.props.imageSize);
        }
      }
    }
  }
};
