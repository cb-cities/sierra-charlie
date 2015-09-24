"use strict";

var ImageId = require("./image-id");


var IMAGE_SIZE   = 1024;
var FIRST_TILE_X = 490;
var LAST_TILE_X  = 572;
var FIRST_TILE_Y = 148;
var LAST_TILE_Y  = 208;
var TILE_X_COUNT = LAST_TILE_X - FIRST_TILE_X + 1;
var TILE_Y_COUNT = LAST_TILE_Y - FIRST_TILE_Y + 1;

var MAX_ZOOM_POWER = 8;


function localToTileX(lx) {
  return FIRST_TILE_X + lx;
}

function localToTileY(ly) {
  return LAST_TILE_Y - ly;
}

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
    var imageSize  = IMAGE_SIZE / zoomLevel;
    var scrollLeft = this.attentionLeft * TILE_X_COUNT * imageSize - this.clientWidth / 2;
    var scrollTop  = this.attentionTop * TILE_Y_COUNT * imageSize - this.clientHeight / 2;
    c.translate(-scrollLeft + 0.25, -scrollTop + 0.25);
    c.scale(1 / zoomLevel, 1 / zoomLevel);
    c.lineWidth = 0.5 * zoomLevel;
    c.fillStyle = c.strokeStyle = this.props.borderColor;
    c.font = 24 * Math.sqrt(zoomLevel) + "px " + this.props.borderFont;
    c.textAlign = "left";
    c.textBaseline = "top";
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
        var tx = localToTileX(lx);
        var ty = localToTileY(ly);
        if (zoomPower < 3) {
          c.globalAlpha = 1 - (zoomPower - 2);
          c.fillText(tx + "×" + ty, lx * IMAGE_SIZE + 4 * Math.sqrt(zoomLevel), ly * IMAGE_SIZE);
          c.globalAlpha = 1;
        }
        c.strokeRect(lx * IMAGE_SIZE, ly * IMAGE_SIZE, IMAGE_SIZE, IMAGE_SIZE);
      }
    }
  },

  getApproximateImage: function (lx, ly, zoomPower) {
    var tx = localToTileX(lx);
    var ty = localToTileY(ly);
    for (var tz = Math.round(zoomPower); tz >= 0; tz--) {
      var imageId = new ImageId(tx, ty, tz);
      var imageData = this.getImage(imageId);
      if (imageData) {
        return imageData;
      }
    }
    for (var tz = Math.round(zoomPower); tz <= MAX_ZOOM_POWER; tz++) {
      var imageId = new ImageId(tx, ty, tz);
      var imageData = this.getImage(imageId);
      if (imageData) {
        return imageData;
      }
    }
    return null;
  },

  paintTileContents: function (c) {
    var zoomPower  = this.storedZoomPower;
    var zoomLevel  = computeZoomLevel(zoomPower);
    var imageSize  = IMAGE_SIZE / zoomLevel;
    var scrollLeft = this.attentionLeft * TILE_X_COUNT * imageSize - this.clientWidth / 2;
    var scrollTop  = this.attentionTop * TILE_Y_COUNT * imageSize - this.clientHeight / 2;
    c.translate(-scrollLeft, -scrollTop);
    c.scale(1 / zoomLevel, -1 / zoomLevel);
    c.translate(0, -TILE_Y_COUNT * IMAGE_SIZE);
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
        var imageData = this.getApproximateImage(lx, ly, zoomPower);
        if (imageData) {
          c.drawImage(imageData, lx * IMAGE_SIZE, (TILE_Y_COUNT - ly - 1) * IMAGE_SIZE, IMAGE_SIZE, IMAGE_SIZE);
        }
      }
    }
  }
};
