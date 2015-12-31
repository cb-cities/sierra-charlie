"use strict";

var BoundedSpiral = require("./lib/bounded-spiral");
var http = require("http-request-wrapper");
var compute = require("./compute")
var defs = require("./defs");
var tid = require("./lib/tile-id");
var tgid = require("./lib/tile-group-id");


var globalVertexOffset = 0;
var globalRoadNodeIndexOffset = 0;
var globalRoadLinkIndexOffset = 0;


function processRoadNodes(roadNodes) {
  var vertices = new Float32Array(roadNodes.length * 2);
  var indices = new Uint32Array(roadNodes.length);
  var results = [];
  for (var i = 0; i < roadNodes.length; i++) {
    results.push({
        toid: roadNodes[i].toid,
        offset: globalRoadNodeIndexOffset
      });
    globalRoadNodeIndexOffset += 1;
    vertices[2 * i] = roadNodes[i].p.x;
    vertices[2 * i + 1] = roadNodes[i].p.y;
    indices[i] = globalVertexOffset;
    globalVertexOffset += 1;
  }
  return {
    vertices: vertices,
    indices: indices,
    results: results
  };
}


function processRoadLinks(roadLinks) {
  var vertexCount = 0;
  var indexCount = 0;
  for (var i = 0; i < roadLinks.length; i++) {
    vertexCount += roadLinks[i].ps.length;
    indexCount += (roadLinks[i].ps.length - 1) * 2;
  }
  var vertexOffset = 0;
  var indexOffset = 0;
  var vertices = new Float32Array(vertexCount * 2);
  var indices = new Uint32Array(indexCount);
  var results = [];
  for (var i = 0; i < roadLinks.length; i++) {
    var count = roadLinks[i].ps.length;
    results.push({
        toid: roadLinks[i].toid,
        count: count,
        offset: globalRoadLinkIndexOffset
      });
    globalRoadLinkIndexOffset += count;  
    for (var j = 0; j < count; j++) {
      var k = vertexOffset + j;
      vertices[2 * k] = roadLinks[i].ps[j].x;
      vertices[2 * k + 1] = roadLinks[i].ps[j].y;
      indices[indexOffset++] = globalVertexOffset + k;
      if (j !== 0 && j !== count - 1) {
        indices[indexOffset++] = globalVertexOffset + k;
      }
    }
    vertexOffset += count;
  }
  globalVertexOffset += vertexOffset;
  return {
    vertices: vertices,
    indices: indices,
    results: results
  };
}


function postLoadedTileGroup(tileGroupId, tileGroupData) {
  var firstTileX = tgid.toFirstTileX(tileGroupId);
  var firstTileY = tgid.toFirstTileY(tileGroupId);
  var lastTileX  = tgid.toLastTileX(tileGroupId);
  var lastTileY  = tgid.toLastTileY(tileGroupId);
  for (var ty = lastTileY; ty >= firstTileY; ty--) {
    if (ty < defs.firstTileY || ty > defs.lastTileY) {
      continue;
    }
    for (var tx = firstTileX; tx <= lastTileX; tx++) {
      if (tx < defs.firstTileX || tx > defs.lastTileX) {
        continue;
      }
      var tileId = tid.fromTile(tx, ty);
      var tileData = tileGroupData[tid.toKey(tileId)] || {};
      var roadNodeData = processRoadNodes(tileData.roadNodes || []);
      var roadLinkData = processRoadLinks(tileData.roadLinks || []);
      postMessage({
          message:          "loadGeometry",
          roadNodeVertices: roadNodeData.vertices,
          roadNodeIndices:  roadNodeData.indices,
          roadNodes:        roadNodeData.results,
          roadLinkVertices: roadLinkData.vertices,
          roadLinkIndices:  roadLinkData.indices,
          roadLinks:        roadLinkData.results
        });
    }
  }
}


function GeometryLoader(origin) {
  this.origin = origin;
  this.localSource = new BoundedSpiral(0, 0, defs.tileXCount - 1, defs.tileYCount - 1);
  this.pendingTileGroupId = null;
  this.loadedTileGroupIds = {};
}

GeometryLoader.prototype = {
  update: function (left, top) {
    var lx = compute.localX(left);
    var ly = compute.localY(top);
    this.localSource.reset(lx, ly);
    this.loadNextTileGroup();
  },

  getNextTileGroupIdToLoad: function () {
    while (true) {
      var local = this.localSource.next();
      if (!local) {
        return null;
      }
      var tx = defs.localToTileX(local.x);
      var ty = defs.localToTileY(local.y);
      var tileGroupId = tgid.fromTile(tx, ty);
      if (!(tileGroupId in this.loadedTileGroupIds)) {
        return tileGroupId;
      }
    }
  },

  loadNextTileGroup: function () {
    if (!this.pendingTileGroupId) {
      this.pendingTileGroupId = this.getNextTileGroupIdToLoad();
      if (this.pendingTileGroupId) {
        var tileGroupUrl = tgid.toUrl(this.origin, this.pendingTileGroupId);
        http.getJsonResource(tileGroupUrl, function (tileGroupData, err) {
            if (!err || err.type === "clientError") {
              this.loadedTileGroupIds[this.pendingTileGroupId] = true;
              postLoadedTileGroup(this.pendingTileGroupId, tileGroupData || {});
            }
            this.pendingTileGroupId = null;
            this.loadNextTileGroup();
          }.bind(this));
      }
    }
  }
};


var worker;

onmessage = function (event) {
  switch (event.data.message) {
    case "setOrigin":
      worker = new GeometryLoader(event.data.origin);
      break;
    case "update":
      worker.update(event.data.left, event.data.top);
      break;
  }
};
