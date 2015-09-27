"use strict";

var LoaderWorker = require("worker?inline!./loader-worker");
var defs = require("./defs");
var iid = require("./image-id");
var tid = require("./tile-id");


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

  onMessage: function (event) {
    switch (event.data.message) {
      case "tileLoaded":
        this.setLoadedTile(event.data.tileId, event.data.tileData);
        this.processVisibleTiles();
        break;
    }
  },

  loadTiles: function (tileIds) {
    if (tileIds.length) {
      this.loaderWorker.postMessage({
          message: "loadTiles",
          tileIds: tileIds
        });
    }
  },

  processVisibleTile: function (lx, ly, floorZoomPower, ceilZoomPower) {
    var tileId = tid.fromLocal(lx, ly);
    if (this.isTileVisible(tileId)) {
      if (!this.getLoadedTile(tileId)) {
        this.processedTileIds.push(tileId);
      } else {
        var floorImageId = iid.fromTileId(tileId, floorZoomPower);
        if (!this.getRenderedImage(floorImageId)) {
          this.processedImageIds.push(floorImageId);
        }
        if (floorZoomPower !== ceilZoomPower) {
          var ceilImageId = iid.fromTileId(tileId, ceilZoomPower);
          if (!this.getRenderedImage(ceilImageId)) {
            this.processedImageIds.push(ceilImageId);
          }
        }
      }
    }
  },

  processVisibleTilesNow: function () {
    var easedZoomPower = this.getEasedZoomPower();
    var floorZoomPower = Math.floor(easedZoomPower);
    var ceilZoomPower  = Math.ceil(easedZoomPower);
    this.processedTileIds  = [];
    this.processedImageIds = [];
    switch (this.state.processMode) {
      case 0:
      case 1:
        var ax = Math.floor(this.getEasedAttentionLeft() * defs.tileXCount);
        var ay = Math.floor(this.getEasedAttentionTop() * defs.tileYCount);
        var layerCount = (
          Math.max(
            Math.max(ax - this.firstVisibleLocalX, this.lastVisibleLocalX - ax),
            Math.max(ay - this.firstVisibleLocalY, this.lastVisibleLocalY - ay)));
        this.processVisibleTile(ax, ay, floorZoomPower, ceilZoomPower);
        if (!this.state.processMode) {
          for (var l = 0; l <= layerCount; l++) {
            for (var i = 1; i <= l * 2; i++) {
              this.processVisibleTile(ax + l,     ay - l + i, floorZoomPower, ceilZoomPower);
            }
            for (var i = 1; i <= l * 2; i++) {
              this.processVisibleTile(ax + l - i, ay + l    , floorZoomPower, ceilZoomPower);
            }
            for (var i = 1; i <= l * 2; i++) {
              this.processVisibleTile(ax - l,     ay + l - i, floorZoomPower, ceilZoomPower);
            }
            for (var i = 1; i <= l * 2; i++) {
              this.processVisibleTile(ax - l + i, ay - l    , floorZoomPower, ceilZoomPower);
            }
          }
        } else {
          for (var l = 0; l <= layerCount; l++) {
            for (var i = 1; i <= l * 2; i++) {
              this.processVisibleTile(ax + l,     ay - l + i, floorZoomPower, ceilZoomPower);
              this.processVisibleTile(ax + l - i, ay + l    , floorZoomPower, ceilZoomPower);
              this.processVisibleTile(ax - l,     ay + l - i, floorZoomPower, ceilZoomPower);
              this.processVisibleTile(ax - l + i, ay - l    , floorZoomPower, ceilZoomPower);
            }
          }
        }
        break;
      default:
        for (var ly = this.firstVisibleLocalY; ly <= this.lastVisibleLocalY; ly++) {
          for (var lx = this.firstVisibleLocalX; lx <= this.lastVisibleLocalX; lx++) {
            this.processVisibleTile(lx, ly, floorZoomPower, ceilZoomPower);
          }
        }
    }
    this.loadTiles(this.processedTileIds.reverse());
    this.queuedImageIds = this.processedImageIds.reverse();
    this.renderNextImage();
  },

  processVisibleTiles: function () {
    clearTimeout(this.pendingProcess);
    this.pendingProcess = setTimeout(this.processVisibleTilesNow, 0);
  }
};
