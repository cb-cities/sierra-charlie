"use strict";

var oboe = require("oboe");
var defs = require("./defs");


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
  var roadNodeIndices = new Uint32Array(defs.maxRoadNodeIndexCount);
  var roadNodeIndexCount = 0;
  var roadNodeIndexOffset = 0;
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
      roadNodeIndices: sliceIndices(roadNodeIndices, roadNodeIndexOffset, roadNodeIndexCount)
    };
    if (post(data, force)) {
      vertexOffset = vertexCount;
      roadNodeIndexOffset = roadNodeIndexCount;
    }
  }
  
  function postRoadLinks(force) {
    var data = {
      message: "loadRoadLinks",
      vertices: sliceVertices(vertices, vertexOffset, vertexCount),
      roadLinkIndices: sliceIndices(roadLinkIndices, roadLinkIndexOffset, roadLinkIndexCount)
    };
    if (post(data, force)) {
      vertexOffset = vertexCount;
      roadLinkIndexOffset = roadLinkIndexCount;
    }
  }
  
  function loadRoadNodes(cb) {
    oboe(origin + "/json/roadnodes.json.gz")
      .node("!.*", function (p, path) {
          // var toid = path[0];
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
      .node("!.*", function (roadLink, path) {
          // var toid = path[0];
          var count = roadLink.ps.length / 2;
          for (var i = 0; i < count; i++) {
            roadLinkIndices[roadLinkIndexCount++] = vertexCount + i;
            if (i !== 0 && i !== count - 1) {
              roadLinkIndices[roadLinkIndexCount++] = vertexCount + i;
            }
          }
          vertices.set(roadLink.ps, vertexCount * 2)
          vertexCount += count;
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
