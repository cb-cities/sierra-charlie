"use strict";

var http = require("http-request-wrapper");
var MISSING_TILE_IDS = require("./missing-tile-ids.js");

var origin;
var tileQueue = [];
var queuedTiles = {};
var pendingTileId;
var loadedTiles = {};

function tileUrl(tileId) {
  return (
    origin + "/json/tile-" + tileId + (
      process.env.NODE_ENV === "production" ?
        ".json.gz" :
        ".json"));
}

function forceQueueAllTiles(ftx, ltx, fty, lty) {
  for (var ty = fty; ty <= lty; ty++) {
    for (var tx = ltx; tx >= ftx; tx--) {
      var tileId = tx + "-" + ty;
      if (!(tileId in MISSING_TILE_IDS)) {
        tileQueue.push(tileId);
        queuedTiles[tileId] = true;
      }
    }
  }
}

function queueTile(tileId) {
  if (tileId !== pendingTileId && !(tileId in loadedTiles)) {
    tileQueue.push(tileId);
    queuedTiles[tileId] = true;
  }
}

function queueTiles(tileIds) {
  for (var i = 0; i < tileIds.length; i++) {
    queueTile(tileIds[i]);
  }
}

function loadNextTile() {
  if (!pendingTileId) {
    while (tileQueue.length) {
      var tileId = tileQueue.pop();
      delete queuedTiles[tileId];
      if (!(tileId in loadedTiles)) {
        pendingTileId = tileId;
        break;
      }
    }
    if (pendingTileId) {
      http.getJsonResource(tileUrl(pendingTileId), function (res, err) {
          if (!err || err.type === "clientError") {
            loadedTiles[pendingTileId] = true;
            res = res || {};
            postMessage({
                message:  "tileDidLoad",
                tileId:   pendingTileId,
                tileData: {
                  roadLinks: res.roadLinks || [],
                  roadNodes: res.roadNodes || []
                }
              });
          }
          pendingTileId = null;
          loadNextTile();
        });
    }
  }
}

onmessage = function (event) {
  switch (event.data.message) {
    case "setOrigin":
      origin = event.data.origin;
      break;
    case "forceQueueAllTiles":
      forceQueueAllTiles(event.data.ftx, event.data.ltx, event.data.fty, event.data.lty);
      break;
    case "loadTiles":
      queueTiles(event.data.tileIds);
      loadNextTile();
      break;
  }
};