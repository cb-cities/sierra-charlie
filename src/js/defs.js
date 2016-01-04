"use strict";

var tileSize  = 1000;
var imageSize = 1024;

var firstTileX = 489000;
var firstTileY = 148000;
var lastTileX  = 573000;
var lastTileY  = 209000;

var tileXCount = (lastTileX - firstTileX) / tileSize + 1;
var tileYCount = (lastTileY - firstTileY) / tileSize + 1;

var maxRoadNodeCount = 343724;
var maxRoadLinkCount = 423541;
var maxRoadLinkPointCount = 2267772;
var maxRoadLinkIndexCount = 3688462;

var minRoadNodeX = 489475;
var maxRoadNodeX = 573675;
var minRoadNodeY = 148000;
var maxRoadNodeY = 209500;

var minRoadLinkX = 488527.5625;
var maxRoadLinkX = 574923;
var minRoadLinkY = 146817.515625;
var maxRoadLinkY = 211143;


var _ = module.exports = {
  tileSize:  tileSize,
  imageSize: imageSize,

  firstTileX: firstTileX,
  firstTileY: firstTileY,
  lastTileX:  lastTileX,
  lastTileY:  lastTileY,

  tileXCount: tileXCount,
  tileYCount: tileYCount,

  treeLeft: 465464, // TODO
  treeTop: 112964, // TODO
  treeSize: 131072, // TODO

  maxTileCount: tileXCount * tileYCount,

  maxWidth:  tileXCount * imageSize,
  maxHeight: tileYCount * imageSize,

  maxZoom: 7,

  maxVertexCount: maxRoadNodeCount + maxRoadLinkPointCount,
  // maxVertexCount: maxRoadNodeCount,

  maxRoadNodeCount: maxRoadNodeCount,
  maxRoadNodeIndexCount: maxRoadNodeCount,

  maxRoadLinkCount: maxRoadLinkCount,
  maxRoadLinkPointCount: maxRoadLinkPointCount,
  maxRoadLinkIndexCount: maxRoadLinkIndexCount,

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
