"use strict";

var assign = require("object-assign");
var defs = require("./defs");
var demoBimodal = require("./demo-bimodal");
var simplify = require("simplify-js");


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

// TODO: Refactor
var globalMeanTravelTimes = [];
var globalRoadLinkCounts = [];
var localMeanTravelTimes = [];
var localRoadLinkCounts = [];
for (var t = 0; t < 24; t++) {
  globalMeanTravelTimes[t] = 0;
  globalRoadLinkCounts[t] = 0;
}
var maxGlobalMeanTravelTime = 0;
var maxLocalMeanTravelTime = 0;

function processRoadLink(ps, length, tileData) {
  var distanceToLondonEye = computeDistance(computeCentroid(ps), LondonEye);
  var centrocity = 1 - (distanceToLondonEye / maxDistanceToLondonEye);
  var freeTravelTime = length / meanTrafficSpeed;
  var capacity = 0.5 + (length / tileData.globalMeanLength) / 2;
  var travelTimes = [];
  for (var t = 0; t < 24; t++) {
    var volume = 20 * (Math.random() + 5 * demoBimodal.figure1(t)) * centrocity;
    var travelTime = freeTravelTime * (1 + volume / capacity) / length;
    travelTimes.push(travelTime);
    globalMeanTravelTimes[t] = (travelTime + globalRoadLinkCounts[t] * globalMeanTravelTimes[t]) / (globalRoadLinkCounts[t] + 1);
    globalRoadLinkCounts[t]++;
    localMeanTravelTimes[t] = (travelTime + localRoadLinkCounts[t] * localMeanTravelTimes[t]) / (localRoadLinkCounts[t] + 1);
    localRoadLinkCounts[t]++;
  }
  return {
    capacity: capacity,
    travelTimes: travelTimes
  };
}

module.exports = {
  processRoadLinks: function (roadLinks, tileData) {
    // TODO: Refactor
    for (var t = 0; t < 24; t++) {
      localMeanTravelTimes[t] = 0;
      localRoadLinkCounts[t] = 0;
    }
    var processedRoadLinks = [];
    for (var i = 0; i < roadLinks.length; i++) {
      var roadLink = roadLinks[i];
      if (roadLink.ps.length > 1) {
        var ps = simplify(roadLink.ps, 1);
        var result = processRoadLink(ps, roadLink.length, tileData);
        processedRoadLinks.push(assign(roadLink, {
            ps: ps
          },
          result));
      }
    }
    maxGlobalMeanTravelTime = Math.max.apply(null, globalMeanTravelTimes);
    maxLocalMeanTravelTime = Math.max(maxLocalMeanTravelTime, Math.max.apply(null, localMeanTravelTimes));
    return {
      processedRoadLinks: processedRoadLinks,
      globalMeanTravelTimes: globalMeanTravelTimes,
      localMeanTravelTimes: localMeanTravelTimes,
      maxGlobalMeanTravelTime: maxGlobalMeanTravelTime,
      maxLocalMeanTravelTime: maxLocalMeanTravelTime
    };
  }
};
