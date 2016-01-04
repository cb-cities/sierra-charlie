"use strict";


var tileSize = 1000;
var clientTileSize = 1024;

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

var quadtreeLeft = 465464;
var quadtreeTop = 112964;
var quadtreeSize = 131072;

var maxZoom = 7;


var _ = module.exports = {
  tileSize: tileSize,
  clientTileSize: clientTileSize,
  clientTileRatio: tileSize / clientTileSize,

  firstTileX: firstTileX,
  firstTileY: firstTileY,
  lastTileX: lastTileX,
  lastTileY: lastTileY,

  tileCountX: tileCountX,
  tileCountY: tileCountY,

  spaceWidth: tileCountX * tileSize,
  spaceHeight: tileCountY * tileSize,

  maxVertexCount: maxRoadNodeCount + maxRoadLinkPointCount,

  maxRoadNodeCount: maxRoadNodeCount,
  maxRoadNodeIndexCount: maxRoadNodeCount,

  maxRoadLinkCount: maxRoadLinkCount,
  maxRoadLinkPointCount: maxRoadLinkPointCount,
  maxRoadLinkIndexCount: maxRoadLinkIndexCount,

  quadtreeLeft: quadtreeLeft,
  quadtreeTop: quadtreeTop,
  quadtreeSize: quadtreeSize,

  maxZoom: maxZoom
};
