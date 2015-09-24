"use strict";

var http = require("http-request-wrapper");

var origin;
var loadQueue = [];
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

function queueLoadTile(flatTileId) {
  if (flatTileId !== pendingTileId && !(flatTileId in loadedTiles)) {
    loadQueue.push(flatTileId);
    queuedTiles[flatTileId] = true;
  }
}

function queueLoadTiles(flatTileIds) {
  for (var i = 0; i < flatTileIds.length; i++) {
    queueLoadTile(flatTileIds[i]);
  }
}

function loadNextTile() {
  if (!pendingTileId) {
    while (loadQueue.length) {
      var flatTileId = loadQueue.pop();
      delete queuedTiles[flatTileId];
      if (!(flatTileId in loadedTiles)) {
        pendingTileId = flatTileId;
        break;
      }
    }
    if (pendingTileId) {
      http.getJsonResource(tileUrl(pendingTileId), function (res, err) {
          if (!err || err.type === "clientError") {
            loadedTiles[pendingTileId] = true;
            res = res || {};
            postMessage({
                message:    "onTileLoad",
                flatTileId: pendingTileId,
                tileData:   {
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
    case "queueLoadTiles":
      queueLoadTiles(event.data.flatTileIds);
      break;
    case "loadNextTile":
      loadNextTile();
      break;
  }
};
