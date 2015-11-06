"use strict";

var LoaderWorker = require("worker?inline!./loader-worker");
var tid = require("./tile-id");


module.exports = {
  componentDidMount: function () {
    // TODO: Refactor
    this.meanTravelTime = 0;
    this.globalMeanTravelTimes = [];
    this.collectedTileIds = [];
    this.loadedTiles = {};
    this.startLoaderWorker();
  },

  componentWillUnmount: function () {
    this.stopLoaderWorker();
    clearTimeout(this.pendingQueueToLoad);
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
        // TODO: Refactor
        this.meanTravelTime = event.data.tileData.meanTravelTime;
        this.globalMeanTravelTimes = event.data.tileData.globalMeanTravelTimes;
        this.setLoadedTile(event.data.tileId, event.data.tileData);
        this.requestQueueingVisibleImagesToRender();
        break;
    }
  },

  queueVisibleTilesToLoad: function () {
    var tileIds = [];
    this.spirally(function (lx, ly) {
        if (this.isTileVisible(lx, ly)) {
          var tileId = tid.fromLocal(lx, ly);
          if (!this.getLoadedTile(tileId)) {
            tileIds.push(tileId);
          }
        }
      }.bind(this));
    if (tileIds.length) {
      this.loaderWorker.postMessage({
          message: "loadTiles",
          tileIds: tileIds.reverse()
        });
    }
  },

  requestQueueingVisibleTilesToLoad: function () {
    clearTimeout(this.pendingQueueToLoad);
    this.pendingQueueToLoad = setTimeout(this.queueVisibleTilesToLoad, 0);
  }
};
