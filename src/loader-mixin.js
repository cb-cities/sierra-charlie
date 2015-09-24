"use strict";

var LoaderWorker = require("worker?inline!./loader-worker");
var TileId = require("./tile-id");


function deflate(tileIds) {
  return (
    tileIds.map(function (tileId) {
        return tileId.toString();
      }));
}

function inflate(tileId) {
  var t = tileId.split("-");
  return new TileId(t[0], t[1]);
}

function spirally(tx, ty, k, cb) {
  cb(tx, ty);
  for (var n = 0; n <= k; n++) {
    for (var i = 0; i < n * 2; i++) {
      cb(tx + n,           ty + i - (n - 1));
      cb(tx - i + (n - 1), ty + n);
      cb(tx - n,           ty - i + (n - 1));
      cb(tx + i - (n - 1), ty - n);
    }
  }
}


module.exports = {
  componentDidMount: function () {
    this.collectedTileIds = [];
    this.loadedTiles = {};
    this.startLoaderWorker();
    // this.collectAllTilesToQueue();
  },

  componentWillUnmount: function () {
    this.stopLoaderWorker();
  },

  setLoadedTile: function (tileId, tileData) {
    this.loadedTiles[tileId] = tileData;
  },

  getLoadedTile: function (tileId) {
    return this.loadedTiles[tileId];
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

  collectTileToQueue: function (tileId) {
    this.collectedTileIds.push(tileId);
  },

  queueTilesToLoad: function () {
    var tileIds = this.collectedTileIds.reverse();
    this.collectedTileIds = [];
    if (tileIds.length) {
      this.loaderWorker.postMessage({
          message: "queueTilesToLoad",
          tileIds: deflate(tileIds)
        });
      return true;
    }
    return false;
  },

  loadNextTile: function () {
    this.loaderWorker.postMessage({
        message: "loadNextTile"
      });
  },

  onMessage: function (event) {
    switch (event.data.message) {
      case "tileLoaded":
        this.onTileLoaded(inflate(event.data.tileId), event.data.tileData);
        break;
    }
  },

  onTileLoaded: function (tileId, tileData) {
    this.setLoadedTile(tileId, tileData);
    if (this.isTileVisible(tileId.tx, tileId.ty)) {
      this.collectImagesToQueue(tileId);
      if (this.queueImagesToRender()) {
        this.renderNextImage();
      }
    }
  },

  collectAllTilesToQueue: function () {
    var atx = this.localToTileX(Math.floor(this.attentionLeft * this.getTileXCount()));
    var aty = this.localToTileY(Math.floor(this.attentionTop * this.getTileYCount()));
    var k = Math.max(
      Math.max(atx, this.props.lastTileX - atx),
      Math.max(aty, this.props.lastTileY - aty));
    spirally(atx, aty, k, function (tx, ty) {
        var tileId = this.getValidTileId(tx, ty);
        if (tileId) {
          this.collectTileToQueue(tileId);
        }
      }.bind(this));
  },

  loadVisibleTiles: function () {
    if (!this.pendingZoom) {
      clearTimeout(this.pendingLoad);
      this.pendingLoad = setTimeout(this.loadVisibleTilesNow, 0);
    }
  },

  loadVisibleTilesNow: function () {
    var tx = this.localToTileX(Math.floor(this.attentionLeft * this.getTileXCount()));
    var ty = this.localToTileY(Math.floor(this.attentionTop * this.getTileYCount()));
    var k = Math.max(
      Math.max(tx - this.firstVisibleTileX, this.lastVisibleTileX - tx),
      Math.max(ty - this.firstVisibleTileY, this.lastVisibleTileY - ty));
    spirally(tx, ty, k, function (tx, ty) {
        var tileId = this.getVisibleTileId(tx, ty);
        if (tileId) {
          if (!this.getLoadedTile(tileId)) {
            this.collectTileToQueue(tileId);
          } else {
            this.collectImagesToQueue(tileId);
          }
        }
      }.bind(this));
    if (this.queueTilesToLoad()) {
      this.loadNextTile();
    }
    if (this.queueImagesToRender()) {
      this.renderNextImage();
    }
  }
};
