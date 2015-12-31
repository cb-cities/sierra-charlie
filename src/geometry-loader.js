"use strict";

var oboe = require("oboe");
var defs = require("./defs");


function start(origin) {
  var vertices = [];
  var vertexCount = 0;
  var roadNodeIndices = [];
  var roadNodeIndexCount = 0;
  var roadLinkIndices = [];
  var roadLinkPointCount = 0;
  var roadLinkIndexCount = 0;
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
      vertices: vertices,
      vertexCount: vertexCount,
      roadNodeIndices: roadNodeIndices,
      roadLinkPointCount: roadLinkPointCount,
      roadNodeIndexCount: roadNodeIndexCount
    };
    if (post(data, force)) {
      vertices = [];
      roadNodeIndices = [];
    }
  }
  
  function postRoadLinks(force) {
    var data = {
      message: "loadRoadLinks",
      vertices: vertices,
      vertexCount: vertexCount,
      roadLinkIndices: roadLinkIndices,
      roadLinkPointCount: roadLinkPointCount,
      roadLinkIndexCount: roadLinkIndexCount
    };
    if (post(data, force)) {
      vertices = [];
      roadLinkIndices = [];
    }
  }
  
  function loadRoadNodes(cb) {
    oboe(origin + "/json/roadnodes.json.gz")
      .node("!.*", function (p, path) {
          // var toid = path[0];
          vertices = vertices.concat(p);
          roadNodeIndices.push(vertexCount);
          roadNodeIndexCount++;
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
          vertices = vertices.concat(roadLink.ps);
          var count = roadLink.ps.length / 2;
          for (var i = 0; i < count; i++) {
            roadLinkIndices.push(vertexCount + i);
            if (i !== 0 && i !== count - 1) {
              roadLinkIndices.push(vertexCount + i);
            }
          }
          roadLinkPointCount += count;
          roadLinkIndexCount += (count - 1) * 2;
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
