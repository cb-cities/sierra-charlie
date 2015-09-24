"use strict";

var http = require("http-request-wrapper");

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
                message:  "onTileLoad",
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
    case "queueTiles":
      queueTiles(event.data.tileIds);
      break;
    case "loadNextTile":
      loadNextTile();
      break;
  }
};
