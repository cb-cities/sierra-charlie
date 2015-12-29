"use strict";

var BoundedSpiral = require("../lib/bounded-spiral");
var http = require("http-request-wrapper");
var compute = require("../compute")
var defs = require("../defs");
var tid = require("../lib/tile-id");
var tgid = require("../lib/tile-group-id");


function _postLoadedTileGroup(tileGroupId, tileGroupData) {
  var firstTileX = tgid.toFirstTileX(tileGroupId);
  var firstTileY = tgid.toFirstTileY(tileGroupId);
  var lastTileX  = tgid.toLastTileX(tileGroupId);
  var lastTileY  = tgid.toLastTileY(tileGroupId);
  for (var ty = lastTileY; ty >= firstTileY; ty--) {
    if (ty < defs.firstTileY || ty > defs.lastTileY) {
      continue;
    }
    for (var tx = firstTileX; tx <= lastTileX; tx++) {
      if (tx < defs.firstTileX || tx > defs.lastTileX) {
        continue;
      }
      var tileId = tid.fromTile(tx, ty);
      var tileData = tileGroupData[tid.toKey(tileId)] || {};
      postMessage({
          message:  "tileLoad",
          tileId:   tileId,
          tileData: {
            roadLinks: tileData.roadLinks || [],
            roadNodes: tileData.roadNodes || []
          }
        });
    }
  }
}


function GeometryLoaderWorker(origin) {
  this._origin = origin;
  this._localSource = new BoundedSpiral(0, 0, defs.tileXCount - 1, defs.tileYCount - 1);
  this._pendingTileGroupId = null;
  this._loadedTileGroupIds = {};
}

GeometryLoaderWorker.prototype = {
  update: function (left, top) {
    var lx = compute.localX(left);
    var ly = compute.localY(top);
    this._localSource.reset(lx, ly);
    this._loadNextTileGroup();
  },

  _getNextTileGroupIdToLoad: function () {
    while (true) {
      var local = this._localSource.next();
      if (!local) {
        return null;
      }
      var tx = defs.localToTileX(local.x);
      var ty = defs.localToTileY(local.y);
      var tileGroupId = tgid.fromTile(tx, ty);
      if (!(tileGroupId in this._loadedTileGroupIds)) {
        return tileGroupId;
      }
    }
  },

  _loadNextTileGroup: function () {
    if (!this._pendingTileGroupId) {
      this._pendingTileGroupId = this._getNextTileGroupIdToLoad();
      if (this._pendingTileGroupId) {
        var tileGroupUrl = tgid.toUrl(this._origin, this._pendingTileGroupId);
        http.getJsonResource(tileGroupUrl, function (tileGroupData, err) {
            if (!err || err.type === "clientError") {
              this._loadedTileGroupIds[this._pendingTileGroupId] = true;
              _postLoadedTileGroup(this._pendingTileGroupId, tileGroupData || {});
            }
            this._pendingTileGroupId = null;
            this._loadNextTileGroup();
          }.bind(this));
      }
    }
  }
};


var worker;

onmessage = function (event) {
  switch (event.data.message) {
    case "setOrigin":
      worker = new GeometryLoaderWorker(event.data.origin);
      break;
    case "update":
      worker.update(event.data.left, event.data.top);
      break;
  }
};
