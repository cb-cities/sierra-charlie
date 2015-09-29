"use strict";

/* global postMessage, onmessage:true */

var assign = require("object-assign");
var http = require("http-request-wrapper");
var simplify = require("simplify-js");
var bimodal = require("./bimodal");
var defs = require("./defs");
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

function convertRoadLinksToSvgData(roadLinks) {
  var svgData = "";
  for (var i = 0; i < roadLinks.length; i++) {
    var ps = roadLinks[i].ps;
    svgData += "M " + ps[0].x + " " + ps[0].y + " ";
    for (var j = 0; j < ps.length; j++) {
      svgData += "L " + ps[j].x + " " + ps[j].y + " ";
    }
  }
  return svgData;
}


function computeDistance(p, q) {
  var dx = p.x - q.x;
  var dy = p.y - q.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function computeCentroid(ps) {
  var sx = 0;
  var sy = 0;
  for (var i = 0; i < ps.length; i++) {
    sx += ps[i].x;
    sy += ps[i].y;
  }
  return {
    x: sx / ps.length,
    y: sy / ps.length
  };
}


var LondonEye = {
  x: defs.firstTileX * 1000 + 0.4897637424698795 * defs.tileXCount * defs.tileSize,
  y: defs.lastTileY * 1000 - 0.4768826844262295 * defs.tileYCount * defs.tileSize
};
var maxDistanceToLondonEye = 52458.01684912481;
var meanTrafficSpeed = 28.6463;

var meanTravelTime = 0;
var count = 0;

function processRoadLinks(roadLinks, tileData) {
  var processedRoadLinks = [];
  for (var i = 0; i < roadLinks.length; i++) {
    var roadLink = roadLinks[i];
    if (roadLink.ps.length > 1) {
      var ps = simplify(roadLink.ps, 1);
      var distanceToLondonEye = computeDistance(computeCentroid(ps), LondonEye);
      var centrocity = 1 - (distanceToLondonEye / maxDistanceToLondonEye);
      var freeTravelTime = roadLink.length / meanTrafficSpeed;
      var capacity = 0.5 + (roadLink.length / tileData.globalMeanLength) / 2;
      var travelTimes = [];
      for (var timeValue = 0; timeValue < 24; timeValue++) {
        var volume = 20 * (Math.random() + 5 * bimodal.figure1(timeValue)) * centrocity;
        var travelTime = freeTravelTime * (1 + volume / capacity) / roadLink.length;
        meanTravelTime = (travelTime + count * meanTravelTime) / (count + 1);
        travelTimes.push(travelTime);
        count++;
      }
      processedRoadLinks.push(assign(roadLink, {
          ps: ps,
          capacity: capacity,
          travelTimes: travelTimes
        }));
    }
  }
  return processedRoadLinks;
}

function processTileData(tileData) {
  var roadLinks = processRoadLinks(tileData.roadLinks || [], tileData);
  return assign(tileData, {
      roadLinks: roadLinks,
      roadNodes: tileData.roadNodes || [],
      // roadLinksSvgData: convertRoadLinksToSvgData(simpleRoadLinks)
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
