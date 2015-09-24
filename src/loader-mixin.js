"use strict";

var LoaderWorker = require("worker?inline!./loader-worker");
var MISSING_TILE_IDS = require("./missing-tile-ids");
var ImageId = require("./image-id");
var TileId = require("./tile-id");


function flatten(tileIds) {
  return (
    tileIds.map(function (tileId) {
        return tileId.toString();
      }));
}


module.exports = {
  componentDidMount: function () {
    this.loadedTiles = {};
    this.startLoaderWorker();
  },

  componentWillUnmount: function () {
    this.stopLoaderWorker();
  },

  getTile: function (tileId) {
    return this.loadedTiles[tileId];
  },

  setTile: function (tileId, tileData) {
    this.loadedTiles[tileId] = tileData;
  },

  startLoaderWorker: function () {
    this.loaderWorker = new LoaderWorker();
    this.loaderWorker.addEventListener("message", this.onMessage);
    this.loaderWorker.postMessage({
        message: "setOrigin",
        origin:  location.origin
      });
  },

  stopLoaderWorker: function () {
    this.loaderWorker.terminate();
    this.loaderWorker.removeEventListener("message", this.onMessage);
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
    var tx = this.localToTileX(Math.floor(this.attentionLeft * this.getTileXCount()));
    var ty = this.localToTileY(Math.floor(this.attentionTop * this.getTileYCount()));
    var k = Math.max(
      Math.max(tx, this.props.lastTileX - tx),
      Math.max(ty, this.props.lastTileY - ty));
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
    this.loaderWorker.postMessage({
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
    var tx = this.localToTileX(Math.floor(this.attentionLeft * this.getTileXCount()));
    var ty = this.localToTileY(Math.floor(this.attentionTop * this.getTileYCount()));
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
    this.loaderWorker.postMessage({
        message:     "queueTiles",
        flatTileIds: flatten(tileIds)
      });
    this.loaderWorker.postMessage({
        message: "loadNextTile"
      });
    this.renderQueue = this.renderQueue.concat(imageIds);
    this.renderNextImage();
  }
};
