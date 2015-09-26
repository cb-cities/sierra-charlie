"use strict";

var assign = require("object-assign");
var http = require("http-request-wrapper");
var simplify = require("simplify-js");
var MISSING_TILE_IDS = require("./missing-tile-ids");


var origin;
var queuedTileIds = [];
var pendingTileId;
var loadedTileIds = {};

function getTileUrl(tileId) {
  return (
    origin + "/json/tile-" + tileId + (
      process.env.NODE_ENV === "production" ?
        ".json.gz" :
        ".json"));
}

function queueTileToLoad(tileId) {
  if (tileId !== pendingTileId && !(tileId in loadedTileIds)) {
    queuedTileIds.push(tileId);
  }
}

function queueTilesToLoad(tileIds) {
  for (var i = 0; i < tileIds.length; i++) {
    queueTileToLoad(tileIds[i]);
  }
}

function postLoadedTile(tileId, roadLinks, roadNodes) {
  postMessage({
      message:  "tileLoaded",
      tileId:   tileId,
      tileData: {
        roadLinks: roadLinks || [],
        roadNodes: roadNodes || []
      }
    });
}

function simplifyRoadLinks(roadLinks) {
  var simpleRoadLinks = [];
  if (roadLinks) {
    for (var i = 0; i < roadLinks.length; i++) {
      if (roadLinks[i].ps.length > 1) {
        simpleRoadLinks.push(assign(roadLinks[i], {
            ps: simplify(roadLinks[i].ps, 1)
          }));
      }
    }
  }
  return simpleRoadLinks;
}

function loadNextTile() {
  if (!pendingTileId) {
    while (queuedTileIds.length) {
      var tileId = queuedTileIds.pop();
      if (!(tileId in loadedTileIds)) {
        pendingTileId = tileId;
        break;
      }
    }
    if (pendingTileId in MISSING_TILE_IDS) {
      loadedTileIds[pendingTileId] = true;
      postLoadedTile(pendingTileId);
      pendingTileId = null;
      loadNextTile();
    } else if (pendingTileId) {
      http.getJsonResource(getTileUrl(pendingTileId), function (res, err) {
          if (!err || err.type === "clientError") {
            loadedTileIds[pendingTileId] = true;
            var roadLinks = res && simplifyRoadLinks(res.roadLinks);
            var roadNodes = res && res.roadNodes;
            postLoadedTile(pendingTileId, roadLinks, roadNodes);
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
    case "queueTilesToLoad":
      queueTilesToLoad(event.data.tileIds);
      break;
    case "loadNextTile":
      loadNextTile();
      break;
  }
};
