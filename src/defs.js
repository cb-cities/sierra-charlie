"use strict";

var firstTileX = 490;
var lastTileX  = 572;
var firstTileY = 148;
var lastTileY  = 208;

var tileXCount = lastTileX - firstTileX + 1;
var tileYCount = lastTileY - firstTileY + 1;


module.exports = {
  tileSize:  1000,
  imageSize: 1024,

  firstTileX: firstTileX,
  lastTileX:  lastTileX,
  firstTileY: firstTileY,
  lastTileY:  lastTileY,

  tileXCount: tileXCount,
  tileYCount: tileYCount,

  maxZoomPower: 7,
  maxProcessMode: 2,

  tileToLocalX: function (tx) {
    return tx - firstTileX;
  },

  tileToLocalY: function (ty) {
    return lastTileY - ty;
  },

  localToTileX: function (lx) {
    return firstTileX + lx;
  },

  localToTileY: function (ly) {
    return lastTileY - ly;
  },

  clampLocalX: function (lx) {
    return (
      Math.max(0,
        Math.min(lx, tileXCount - 1)));
  },

  clampLocalY: function (ly) {
    return (
      Math.max(0,
        Math.min(ly, tileYCount - 1)));
  },

  backgroundColor:        "#000",
  inverseBackgroundColor: "#fff",

  roadLinkColor: "#f63",
  roadNodeColor: "#f93",

  borderColor: "#333",

  labelColor: "#333",
  labelFont: '"HelveticaNeue-Light", Helvetica, Arial, sans-serif'
};
