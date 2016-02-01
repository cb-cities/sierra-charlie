"use strict";


const tileSize = 1000;
const baseClientTileSize = 1024;

const firstTileX = 489000;
const firstTileY = 148000;
const lastTileX = 573000;
const lastTileY = 209000;

const tileCountX = (lastTileX - firstTileX) / tileSize + 1;
const tileCountY = (lastTileY - firstTileY) / tileSize + 1;

const maxRoadNodeCount = 343724;
const maxRoadLinkCount = 423541;
const maxRoadLinkPointCount = 1433365; // simplified from 2267772
const maxRoadLinkIndexCount = 2019648; // simplified from 3688462
const maxRoadCount = 85237;
const maxAddressCount = 343443;

const quadtreeLeft = 465464;
const quadtreeTop = 112964;
const quadtreeSize = 131072;


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

  maxGeometryItemCount: maxRoadNodeCount + maxRoadLinkCount + maxRoadCount + maxAddressCount,
  maxVertexCount: maxRoadNodeCount + maxRoadLinkPointCount,
  maxRoadNodeCount: maxRoadNodeCount,
  maxRoadLinkCount: maxRoadLinkCount,
  maxRoadLinkPointCount: maxRoadLinkPointCount,
  maxRoadLinkIndexCount: maxRoadLinkIndexCount,
  maxRoadCount: maxRoadCount,
  maxAddressCount: maxAddressCount,

  quadtreeLeft: quadtreeLeft,
  quadtreeTop: quadtreeTop,
  quadtreeSize: quadtreeSize,

  defaultCenterX: 528180.744,
  defaultCenterY: 182584.548,

  minZoom: 0,
  actualZoom: 2,
  defaultZoom: 7,
  maxZoom: 9,

  minLoaderPostingCount: 256,
  maxLoaderPostingCount: 1024,
  maxLoaderPostingDelay: 1000,

  textureSize: 1024,
  textureDataSize: 1024 * 1024
};
