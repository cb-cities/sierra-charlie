"use strict";

var oboe = require("oboe");
var defs = require("./defs");
var polyline = require("./polyline");


function sliceVertices(array, offset, count) {
  return new Float32Array(array.buffer.slice(offset * 2 * 4, count * 2 * 4));
}


function sliceIndices(array, offset, count) {
  return new Uint32Array(array.buffer.slice(offset * 4, count * 4));
}


function start(origin) {
  var vertices = new Float32Array(defs.maxVertexCount * 2);
  var vertexCount = 0;
  var vertexOffset = 0;
  var roadNodes = [];
  var roadNodeIndices = new Uint32Array(defs.maxRoadNodeIndexCount);
  var roadNodeIndexCount = 0;
  var roadNodeIndexOffset = 0;
  var roadLinks = [];
  var roadLinkIndices = new Uint32Array(defs.maxRoadLinkIndexCount);
  var roadLinkIndexCount = 0;
  var roadLinkIndexOffset = 0;
  var lastPost = 0;

  function post(data, force) {
    if (force || lastPost + 100 < Date.now()) {
      lastPost = Date.now();
      postMessage(data);
      return true;
    }
    return false;
  }

  function postRoadNodes(force) {
    var data = {
      message: "loadRoadNodes",
      vertices: sliceVertices(vertices, vertexOffset, vertexCount),
      roadNodes: roadNodes,
      roadNodeIndices: sliceIndices(roadNodeIndices, roadNodeIndexOffset, roadNodeIndexCount)
    };
    if (post(data, force)) {
      vertexOffset = vertexCount;
      roadNodes = [];
      roadNodeIndexOffset = roadNodeIndexCount;
    }
  }

  function postRoadLinks(force) {
    var data = {
      message: "loadRoadLinks",
      vertices: sliceVertices(vertices, vertexOffset, vertexCount),
      roadLinks: roadLinks,
      roadLinkIndices: sliceIndices(roadLinkIndices, roadLinkIndexOffset, roadLinkIndexCount)
    };
    if (post(data, force)) {
      vertexOffset = vertexCount;
      roadLinks = [];
      roadLinkIndexOffset = roadLinkIndexCount;
    }
  }

  function loadRoadNodes(cb) {
    oboe(origin + "/json/roadnodes.json.gz")
      .node("!.*", function (p, path) {
          var toid = path[0];
          roadNodes.push({
              toid: toid,
              vertexOffset: vertexCount,
              indexOffset: roadNodeIndexCount
            });
          roadNodeIndices[roadNodeIndexCount++] = vertexCount;
          vertices.set(p, vertexCount * 2);
          vertexCount++;
          postRoadNodes();
          return oboe.drop;
        })
      .done(function () {
          postRoadNodes(true);
          if (cb) {
            cb();
          }
        });
  }

  function loadRoadLinks(n, cb) {
    oboe(origin + "/json/roadlinks" + n + ".json.gz")
      .node("!.*", function (obj, path) {
          var toid = path[0];
          var pointCount = obj.ps.length / 2;
          roadLinks.push({
              toid: toid,
              length: obj.len,
              pointCount: pointCount,
              vertexOffset: vertexCount,
              indexOffset: roadLinkIndexCount,
              negativeNode: obj.neg,
              positiveNode: obj.pos
            });
          for (var i = 0; i < pointCount; i++) {
            roadLinkIndices[roadLinkIndexCount++] = vertexCount + i;
            if (i !== 0 && i !== pointCount - 1) {
              roadLinkIndices[roadLinkIndexCount++] = vertexCount + i;
            }
          }
          vertices.set(obj.ps, vertexCount * 2)
          vertexCount += pointCount;
          postRoadLinks();
          return oboe.drop;
        })
      .done(function () {
          postRoadLinks(true);
          if (cb) {
            cb();
          }
        });
  }

  loadRoadNodes();
  for (var i = 1; i <= 5; i++) {
    loadRoadLinks(i);
  }
}


onmessage = function (event) {
  switch (event.data.message) {
    case "start":
      start(event.data.origin);
      break;
  }
};
