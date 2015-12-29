"use strict";

var GeometryLoaderWorker = require("worker?inline!./geometry-loader-worker");
var defs = require("../defs");


function GeometryLoader(callbacks) {
  this._callbacks = callbacks;
  this._loadedTiles = {};
  this._loadedTileCount = 0;
  this._startWorker();
}

GeometryLoader.prototype = {
  _startWorker: function () { 
    this._worker = new GeometryLoaderWorker();
    this._worker.addEventListener("message", this._onMessage.bind(this));
    this._worker.postMessage({
        message: "setOrigin",
        origin:  location.origin
      });
  },
  
  _stopWorker: function () {
    this._worker.removeEventListener("message", this._onMessage.bind(this));
    this._worker.terminate();
  },
  
  _setLoadedTile: function (tileId, tileData) {
    this._loadedTiles[tileId] = tileData;
    this._loadedTileCount++;
  },

  getLoadedTile: function (tileId) {
    return this._loadedTiles[tileId];
  },
  
  _isFinished: function () {
    return this._loadedTileCount === defs.maxTileCount;
  },

  update: function (left, top) {
    if (!this._isFinished()) {
      this._worker.postMessage({
          message: "update",
          left:    left,
          top:     top
        });
    }
  },
  
  _onMessage: function (event) {
    switch (event.data.message) {
      case "tileLoad":
        this._setLoadedTile(event.data.tileId, event.data.tileData);
        this._callbacks.onTileLoad(event.data.tileId, event.data.tileData);
        if (this._isFinished()) {
          this._stopWorker();
        }
        break;
    }
  },
};

module.exports = GeometryLoader;
