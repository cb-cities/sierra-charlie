"use strict";

/* global postMessage, onmessage:true */

var assign = require("object-assign");
var http = require("http-request-wrapper");
var simplify = require("simplify-js");
var MISSING_TILE_IDS = require("./missing-tile-ids");
var tid = require("./tile-id");


var origin;
var queuedTileIds = [];
var pendingTileId;
var loadedTileIds = {};


function queueTilesToLoad(tileIds) {
  queuedTileIds = [];
  for (var i = 0; i < tileIds.length; i++) {
    if (tileIds[i] !== pendingTileId && !(tileIds[i] in loadedTileIds)) {
      queuedTileIds.push(tileIds[i]);
    }
  }
}

function simplifyRoadLinks(roadLinks) {
  var simpleRoadLinks = [];
  for (var i = 0; i < roadLinks.length; i++) {
    if (roadLinks[i].ps.length > 1) {
      simpleRoadLinks.push(assign(roadLinks[i], {
          ps: simplify(roadLinks[i].ps, 1)
        }));
    }
  }
  return simpleRoadLinks;
}

function processTileData(tileData) {
  return assign(tileData, {
      roadLinks: simplifyRoadLinks(tileData.roadLinks || []),
      roadNodes: tileData.roadNodes || []
    });
}

function postLoadedTile(tileId, tileData) {
  postMessage({
      message:  "tileLoaded",
      tileId:   tileId,
      tileData: processTileData(tileData || {})
    });
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
      postLoadedTile(pendingTileId, null);
      pendingTileId = null;
      loadNextTile();
    } else if (pendingTileId) {
      http.getJsonResource(origin + tid.toPath(pendingTileId), function (tileData, err) {
          if (!err || err.type === "clientError") {
            loadedTileIds[pendingTileId] = true;
            postLoadedTile(pendingTileId, tileData);
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
    case "loadTiles":
      queueTilesToLoad(event.data.tileIds);
      loadNextTile();
      break;
  }
};
