"use strict";

var Loader = require("worker?inline!./loader");
var MISSING_TILE_IDS = require("./missing-tile-ids");
var ImageId = require("./image-id");
var TileId = require("./tile-id");


var FIRST_TILE_X = 490;
var LAST_TILE_X  = 572;
var FIRST_TILE_Y = 148;
var LAST_TILE_Y  = 208;
var TILE_X_COUNT = LAST_TILE_X - FIRST_TILE_X + 1;
var TILE_Y_COUNT = LAST_TILE_Y - FIRST_TILE_Y + 1;


function isTileValid(tx, ty) {
  return (
    tx >= FIRST_TILE_X && tx <= LAST_TILE_X &&
    ty >= FIRST_TILE_Y && ty <= LAST_TILE_Y);
}

function localToTileX(lx) {
  return FIRST_TILE_X + lx;
}

function localToTileY(ly) {
  return LAST_TILE_Y - ly;
}

function flatten(tileIds) {
  return (
    tileIds.map(function (tileId) {
        return tileId.toString();
      }));
}


module.exports = {
  componentDidMount: function () {
    this.loadedTiles = {};
    this.startLoader();
  },

  componentWillUnmount: function () {
    this.stopLoader();
  },

  getTile: function (tileId) {
    return this.loadedTiles[tileId];
  },

  setTile: function (tileId, tileData) {
    this.loadedTiles[tileId] = tileData;
  },

  startLoader: function () {
    this.loader = new Loader();
    this.loader.addEventListener("message", this.onMessage);
    this.loader.postMessage({
        message: "setOrigin",
        origin:  location.origin
      });
  },

  stopLoader: function () {
    this.loader.terminate();
    this.loader.removeEventListener("message", this.onMessage);
  },

  onMessage: function (event) {
    switch (event.data.message) {
      case "onTileLoad":
        this.onTileLoad(event.data.flatTileId, event.data.tileData);
        break;
    }
  },

  onTileLoad: function (flatTileId, tileData) {
    var t = flatTileId.split("-");
    var tileId = new TileId(t[0], t[1]);
    this.setTile(tileId, tileData);
    if (this.isTileIdVisible(tileId)) {
      var zoomPower = this.getZoomPower();
      var floorImageId = new ImageId(tileId.tx, tileId.ty, Math.floor(zoomPower));
      var ceilImageId  = new ImageId(tileId.tx, tileId.ty, Math.ceil(zoomPower));
      this.renderQueue.push(floorImageId);
      if (ceilImageId !== floorImageId) {
        this.renderQueue.push(ceilImageId);
      }
      this.renderNextImage();
    }
  },

  queueAllTiles: function () {
    var tx = localToTileX(Math.floor(this.attentionLeft * TILE_X_COUNT));
    var ty = localToTileY(Math.floor(this.attentionTop * TILE_Y_COUNT));
    var k = Math.max(
      Math.max(tx, LAST_TILE_X - tx),
      Math.max(ty, LAST_TILE_Y - ty));
    var tileIds = [];
    function push(tx, ty) {
      if (isTileValid(tx, ty)) {
        var tileId = new TileId(tx, ty);
        if (!(tileId in MISSING_TILE_IDS)) {
          tileIds.push(tileId);
        }
      }
    }
    push(tx, ty);
    for (var n = 0; n <= k; n++) {
      for (var i = 0; i < n * 2; i++) {
        push(tx + n,           ty + i - (n - 1));
        push(tx - i + (n - 1), ty + n);
        push(tx - n,           ty - i + (n - 1));
        push(tx + i - (n - 1), ty - n);
      }
    }
    tileIds.reverse();
    this.loader.postMessage({
        message:     "queueTiles",
        flatTileIds: flatten(tileIds)
      });
  },

  loadVisibleTiles: function () {
    if (!this.pendingZoom) {
      clearTimeout(this.pendingLoad);
      this.pendingLoad = setTimeout(this.loadVisibleTilesNow, 0);
    }
  },

  loadVisibleTilesNow: function () {
    var zoomPower = this.getZoomPower();
    var tx = localToTileX(Math.floor(this.attentionLeft * TILE_X_COUNT));
    var ty = localToTileY(Math.floor(this.attentionTop * TILE_Y_COUNT));
    var k = Math.max(
      Math.max(tx - this.fvtx, this.lvtx - tx),
      Math.max(ty - this.fvty, this.lvty - ty));
    var isTileVisible = this.isTileVisible;
    var tileIds = [];
    var getTile = this.getTile;
    var imageIds = [];
    var getImage = this.getImage;
    function push(tx, ty) {
      if (isTileVisible(tx, ty)) {
        var tileId = new TileId(tx, ty);
        if (!(tileId in MISSING_TILE_IDS)) {
          if (!getTile(tileId)) {
            tileIds.push(tileId);
          } else {
            var floorImageId = new ImageId(tx, ty, Math.floor(zoomPower));
            var ceilImageId  = new ImageId(tx, ty, Math.ceil(zoomPower));
            if (!getImage(floorImageId)) {
              imageIds.push(floorImageId);
            }
            if (ceilImageId !== floorImageId && !getImage(ceilImageId)) {
              imageIds.push(ceilImageId);
            }
          }
        }
      }
    }
    push(tx, ty);
    for (var n = 0; n <= k; n++) {
      for (var i = 0; i < n * 2; i++) {
        push(tx + n,           ty + i - (n - 1));
        push(tx - i + (n - 1), ty + n);
        push(tx - n,           ty - i + (n - 1));
        push(tx + i - (n - 1), ty - n);
      }
    }
    tileIds.reverse();
    imageIds.reverse();
    this.loader.postMessage({
        message:     "queueTiles",
        flatTileIds: flatten(tileIds)
      });
    this.loader.postMessage({
        message: "loadNextTile"
      });
    this.renderQueue = this.renderQueue.concat(imageIds);
    this.renderNextImage();
  }
};
