"use strict";

var tileSize  = 1000;
var imageSize = 1024;

var firstTileX = 490;
var firstTileY = 148;
var lastTileX  = 572;
var lastTileY  = 207;

var tileXCount = lastTileX - firstTileX + 1;
var tileYCount = lastTileY - firstTileY + 1;


var _ = module.exports = {
  tileSize:  tileSize,
  imageSize: imageSize,

  firstTileX: firstTileX,
  firstTileY: firstTileY,
  lastTileX:  lastTileX,
  lastTileY:  lastTileY,

  tileXCount: tileXCount,
  tileYCount: tileYCount,

  maxTileCount: tileXCount * tileYCount,

  width:  tileXCount * imageSize,
  height: tileYCount * imageSize,

  maxZoom: 7,

  tileToLocalX: function (tx) {
    return tx - firstTileX;
  },

  tileToLocalY: function (ty) {
    return lastTileY - ty;
  },

  tileToNationalGridX: function (tx) {
    return tx * tileSize;
  },

  tileToNationalGridY: function (ty) {
    return ty * tileSize;
  },

  nationalGridToTileX: function (ngx) {
    return Math.floor(ngx / tileSize);
  },

  nationalGridToTileY: function (ngy) {
    return Math.floor(ngy / tileSize);
  },

  localToTileX: function (lx) {
    return firstTileX + lx;
  },

  localToTileY: function (ly) {
    return lastTileY - ly;
  },

  localToNationalGridX: function (x) {
    return _.tileToNationalGridX(_.localToTileX(x));
  },

  localToNationalGridY: function (y) {
    return _.tileToNationalGridY(_.localToTileY(y));
  },

  backgroundColor:        "#000",
  inverseBackgroundColor: "#fff",

  roadLinkColor: "#39f",
  roadNodeColor: "#36f",

  borderColor: "#333",

  labelColor: "#333",
  labelFont: '"HelveticaNeue-Light", Helvetica, Arial, sans-serif'
};
