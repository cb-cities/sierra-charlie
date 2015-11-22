"use strict";

/* global postMessage, onmessage:true */

var BoundedSpiral = require("./lib/bounded-spiral");
var assign = require("object-assign");
var http = require("http-request-wrapper");
var defs = require("./defs");
var demoProcessor = require("./demo-processor");
var tid = require("./tile-id");
var tgid = require("./tile-group-id");


var localSource = new BoundedSpiral(0, defs.tileXCount - 1, 0, defs.tileYCount - 1);
var origin;
var pendingTileGroupId;
var loadedTileGroupIds = {};


function processTileData(tileData) {
  var result = demoProcessor.processRoadLinks(tileData.roadLinks || [], tileData);
  return assign(tileData, {
      roadLinks: result.processedRoadLinks,
      roadNodes: tileData.roadNodes || [],
      globalMeanTravelTimes: result.globalMeanTravelTimes,
      localMeanTravelTimes: result.localMeanTravelTimes,
      maxGlobalMeanTravelTime: result.maxGlobalMeanTravelTime,
      maxLocalMeanTravelTime: result.maxLocalMeanTravelTime
    });
}

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
      var tileData = tileGroupData[tid.toKey(tileId)];
      postMessage({
          message:  "tileLoaded",
          tileId:   tileId,
          tileData: processTileData(tileData || {})
        });
    }
  }
}

function getNextUnloadedTileGroupId() {
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
    pendingTileGroupId = getNextUnloadedTileGroupId();
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
