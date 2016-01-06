"use strict";


var tileSize = 1000;
var baseClientTileSize = 1024;

var firstTileX = 489000;
var firstTileY = 148000;
var lastTileX = 573000;
var lastTileY = 209000;

var tileCountX = (lastTileX - firstTileX) / tileSize + 1;
var tileCountY = (lastTileY - firstTileY) / tileSize + 1;

var maxRoadNodeCount = 343724;
var maxRoadLinkCount = 423541;
var maxRoadLinkPointCount = 2267772;
var maxRoadLinkIndexCount = 3688462;

var maxAddressCount = 343443;

var quadtreeLeft = 465464;
var quadtreeTop = 112964;
var quadtreeSize = 131072;

var minZoom = -2;
var maxZoom = 7;


module.exports = {
  tileSize: tileSize,
  baseClientTileSize: baseClientTileSize,

  firstTileX: firstTileX,
  firstTileY: firstTileY,
  lastTileX: lastTileX,
  lastTileY: lastTileY,

  tileCountX: tileCountX,
  tileCountY: tileCountY,

  totalWidth: tileCountX * tileSize,
  totalHeight: tileCountY * tileSize,
  totalBaseClientWidth: tileCountX * baseClientTileSize,
  totalBaseClientHeight: tileCountY * baseClientTileSize,

  maxVertexCount: maxRoadNodeCount + maxRoadLinkPointCount,

  maxRoadNodeCount: maxRoadNodeCount,
  maxRoadNodeIndexCount: maxRoadNodeCount,

  maxRoadLinkCount: maxRoadLinkCount,
  maxRoadLinkPointCount: maxRoadLinkPointCount,
  maxRoadLinkIndexCount: maxRoadLinkIndexCount,

  maxAddressCount: maxAddressCount,

  quadtreeLeft: quadtreeLeft,
  quadtreeTop: quadtreeTop,
  quadtreeSize: quadtreeSize,

  minZoom: minZoom,
  maxZoom: maxZoom
};
