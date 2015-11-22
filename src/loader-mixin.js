"use strict";

var LoaderWorker = require("worker?inline!./loader-worker");
var defs = require("./defs");


module.exports = {
  componentDidMount: function () {
    // TODO: Refactor
    this.globalMeanTravelTimes = [];
    this.maxGlobalMeanTravelTime = 0;
    this.maxLocalMeanTravelTime = 0;
    this.loadedTiles = {};
    this.loadedTileCount = 0;
    this.startLoaderWorker();
  },

  componentWillUnmount: function () {
    this.stopLoaderWorker();
  },

  setLoadedTile: function (tileId, tileData) {
    this.loadedTiles[tileId] = tileData;
    this.loadedTileCount++;
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
        this.globalMeanTravelTimes = event.data.tileData.globalMeanTravelTimes;
        this.maxGlobalMeanTravelTime = event.data.tileData.maxGlobalMeanTravelTime;
        this.maxLocalMeanTravelTime = event.data.tileData.maxLocalMeanTravelTime;
        this.setLoadedTile(event.data.tileId, event.data.tileData);
        this.requestRenderingImages();
        this.requestPainting();
        break;
    }
  },

  requestLoadingTiles: function () {
    if (this.loadedTileCount < defs.maxTileCount) {
      this.loaderWorker.postMessage({
          message:         "loadTiles",
          attentionLocalX: this.attentionLocalX,
          attentionLocalY: this.attentionLocalY
        });
    }
  }
};
