"use strict";

var LoaderWorker = require("worker?inline!./loader-worker");
var defs = require("./defs");
var tid = require("./tile-id");


function spirally(tx, ty, k, cb) {
  cb(tx, ty);
  for (var n = 0; n <= k; n++) {
    for (var i = 1; i <= n * 2; i++) {
      cb(tx + n,     ty - n + i);
      cb(tx + n - i, ty + n);
      cb(tx - n,     ty + n - i);
      cb(tx - n + i, ty - n);
    }
  }
}


module.exports = {
  componentDidMount: function () {
    this.collectedTileIds = [];
    this.loadedTiles = {};
    this.startLoaderWorker();
  },

  componentWillUnmount: function () {
    this.stopLoaderWorker();
    clearTimeout(this.pendingProcess);
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

  loadTiles: function () {
    var tileIds = this.collectedTileIds.reverse();
    this.collectedTileIds = [];
    if (tileIds.length) {
      this.loaderWorker.postMessage({
          message: "loadTiles",
          tileIds: tileIds
        });
    }
  },

  onMessage: function (event) {
    switch (event.data.message) {
      case "tileLoaded":
        this.setLoadedTile(event.data.tileId, event.data.tileData);
        this.processVisibleTiles();
        break;
    }
  },

  processVisibleTilesNow: function () {
    var alx = Math.floor(this.getEasedAttentionLeft() * defs.tileXCount);
    var aly = Math.floor(this.getEasedAttentionTop() * defs.tileYCount);
    var layerCount = (
      Math.max(
        Math.max(alx - this.firstVisibleLocalX, this.lastVisibleLocalX - alx),
        Math.max(aly - this.firstVisibleLocalY, this.lastVisibleLocalY - aly)));
    var easedZoomPower = this.getEasedZoomPower();
    var floorZoomPower = Math.floor(easedZoomPower);
    var ceilZoomPower  = Math.ceil(easedZoomPower);
    spirally(alx, aly, layerCount, function (lx, ly) {
        if (this.isTileVisible(lx, ly)) {
          var tileId = tid.fromLocal(lx, ly);
          if (!this.getLoadedTile(tileId)) {
            this.collectTileToQueue(tileId);
          } else {
            this.collectImagesToQueue(tileId, floorZoomPower, ceilZoomPower);
          }
        }
      }.bind(this));
    this.loadTiles();
    this.queueImagesToRender();
    this.renderNextImage();
  },

  processVisibleTiles: function () {
    clearTimeout(this.pendingProcess);
    this.pendingProcess = setTimeout(this.processVisibleTilesNow, 0);
  }
};
