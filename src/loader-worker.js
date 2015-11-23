"use strict";

/* global postMessage, onmessage:true */

var BoundedSpiral = require("./lib/bounded-spiral");
var http = require("http-request-wrapper");
var defs = require("./defs");
var tid = require("./tile-id");
var tgid = require("./tile-group-id");


var origin;
var localSource = new BoundedSpiral(0, defs.tileXCount - 1, 0, defs.tileYCount - 1);
var pendingTileGroupId = null;
var loadedTileGroupIds = {};


function postLoadedTileGroup(tileGroupId, tileGroupData) {
  var firstTileX = tgid.toFirstTileX(tileGroupId);
  var lastTileX  = tgid.toLastTileX(tileGroupId);
  var firstTileY = tgid.toFirstTileY(tileGroupId);
  var lastTileY  = tgid.toLastTileY(tileGroupId);
  for (var ty = lastTileY; ty >= firstTileY; ty--) {
    if (ty < defs.firstTileY || ty > defs.lastTileY) {
      continue;
    }
    for (var tx = firstTileX; tx <= lastTileX; tx++) {
      if (tx < defs.firstTileX || tx > defs.lastTileX) {
        continue;
      }
      var tileId   = tid.fromTile(tx, ty);
      var tileData = tileGroupData[tid.toKey(tileId)] || {};
      postMessage({
          message:  "tileLoaded",
          tileId:   tileId,
          tileData: {
            roadLinks: tileData.roadLinks || [],
            roadNodes: tileData.roadNodes || [],
            localMeanTravelTimes: tileData.localMeanTravelTimes || [],
            globalMeanTravelTimes: tileGroupData.globalMeanTravelTimes || [],
            maxLocalMeanTravelTime: tileGroupData.maxLocalMeanTravelTime || 0,
            maxGlobalMeanTravelTime: tileGroupData.maxGlobalMeanTravelTime || 0
          }
        });
    }
  }
}

function getNextTileGroupIdToLoad() {
  while (true) {
    var local = localSource.next();
    if (!local) {
      return null;
    }
    var tx = defs.localToTileX(local.x);
    var ty = defs.localToTileY(local.y);
    var tileGroupId = tgid.fromTile(tx, ty);
    if (!(tileGroupId in loadedTileGroupIds)) {
      return tileGroupId;
    }
  }
}

function loadNextTileGroup() {
  if (!pendingTileGroupId) {
    pendingTileGroupId = getNextTileGroupIdToLoad();
    if (pendingTileGroupId) {
      var tileGroupUrl = tgid.toUrl(origin, pendingTileGroupId);
      http.getJsonResource(tileGroupUrl, function (tileGroupData, err) {
          if (!err || err.type === "clientError") {
            loadedTileGroupIds[pendingTileGroupId] = true;
            postLoadedTileGroup(pendingTileGroupId, tileGroupData || {});
          }
          pendingTileGroupId = null;
          loadNextTileGroup();
        });
    }
  }
}

onmessage = function (event) {
  switch (event.data.message) {
    case "setOrigin":
      origin = event.data.origin;
      break;
    case "loadTiles":
      var lx = event.data.attentionLocalX;
      var ly = event.data.attentionLocalY;
      localSource.reset(lx, ly);
      loadNextTileGroup();
      break;
  }
};
