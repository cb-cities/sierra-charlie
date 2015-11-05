"use strict";

/* global postMessage, onmessage:true */

var assign = require("object-assign");
var http = require("http-request-wrapper");
var demoProcessor = require("./demo-processor");
var tid = require("./tile-id");
var tgid = require("./tile-group-id");


var origin;
var queuedTileGroupIds = [];
var pendingTileGroupId;
var loadedTileGroupIds = {};


function queueTilesToLoad(tileIds) {
  for (var i = 0; i < tileIds.length; i++) {
    var tileGroupId = tgid.fromTileId(tileIds[i]);
    if (tileGroupId !== pendingTileGroupId && !(tileGroupId in loadedTileGroupIds)) {
      queuedTileGroupIds.push(tileGroupId);
    }
  }
}

function processTileData(tileData) {
  var roadLinks = demoProcessor.processRoadLinks(tileData.roadLinks || [], tileData);
  return assign(tileData, {
      roadLinks: roadLinks,
      roadNodes: tileData.roadNodes || []
    });
}

function postLoadedTileGroup(tileGroupId, tileGroupData) {
  var firstTileX = tgid.toFirstTileX(tileGroupId);
  var lastTileX  = tgid.toLastTileX(tileGroupId);
  var firstTileY = tgid.toFirstTileY(tileGroupId);
  var lastTileY  = tgid.toLastTileY(tileGroupId);
  for (var ty = lastTileY; ty >= firstTileY; ty--) {
    for (var tx = firstTileX; tx <= lastTileX; tx++) {
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

function loadNextTileGroup() {
  if (!pendingTileGroupId) {
    while (queuedTileGroupIds.length) {
      var tileGroupId = queuedTileGroupIds.pop();
      if (!(tileGroupId in loadedTileGroupIds)) {
        pendingTileGroupId = tileGroupId;
        break;
      }
    }
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
      queueTilesToLoad(event.data.tileIds);
      loadNextTileGroup();
      break;
  }
};
