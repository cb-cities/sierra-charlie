"use strict";

var oboe = require("oboe");
var defs = require("./defs");


function start(origin) {
  var vertices = [];
  var vertexCount = 0;
  var roadNodeIndices = [];
  var roadNodeIndexCount = 0;
  var roadLinkIndices = [];
  var roadLinkIndexCount = 0;
  var lastPost = 0;
  
  function postRoadNodes() {
    if (lastPost + 1000 < Date.now()) {
      postMessage({
          message: "loadRoadNodes",
          vertices: vertices,
          vertexCount: vertexCount,
          roadNodeIndices: roadNodeIndices,
          roadNodeIndexCount: roadNodeIndexCount
        });
      vertices = [];
      roadNodeIndices = [];
      lastPost = Date.now();
    }
  }
  
  function postRoadLinks() {
    if (lastPost + 100 < Date.now()) {
      postMessage({
          message: "loadRoadLinks",
          vertices: vertices,
          vertexCount: vertexCount,
          roadLinkIndices: roadLinkIndices,
          roadLinkIndexCount: roadLinkIndexCount
        });
      vertices = [];
      roadLinkIndices = [];
      lastPost = Date.now();
    }
  }
  
  oboe(origin + "/json/roadnodes.json.gz")
    .node("!.*", function (p, path) {
        // var toid = path[0];
        vertices.push(p[0]);
        vertices.push(p[1]);
        roadNodeIndices.push(vertexCount);
        roadNodeIndexCount++;
        vertexCount++;
        postRoadNodes();
        return oboe.drop;
      })
    .done(postRoadNodes);


  [1, 2, 3, 4, 5].forEach(function (n) {
      oboe(origin + "/json/roadlinks" + n + ".json.gz")
        .node("!.*", function (roadLink, path) {
            // var toid = path[0];
            for (var i = 0; i < roadLink.ps.length; i++) {
              vertices.push(roadLink.ps[i][0]);
              vertices.push(roadLink.ps[i][1]);
              roadLinkIndices.push(vertexCount + i);
              roadLinkIndexCount++;
              if (i !== 0 && i !== roadLink.ps.length - 1) {
                roadLinkIndices.push(vertexCount + i);
                roadLinkIndexCount++;
              }
            }
            vertexCount += roadLink.ps.length;
            postRoadLinks();
            return oboe.drop;
          })
        .done(postRoadLinks);
    });
}


onmessage = function (event) {
  switch (event.data.message) {
    case "start":
      start(event.data.origin);
      break;
  }
};
