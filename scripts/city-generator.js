'use strict';

var random = require('./common/random');
var sorted2d = require('./common/sorted2d');

var NODE_ID = 0;
var EDGE_ID = 0;

var _ = module.exports = {
  addEdges: function (nodes, edges, count, scale, center) {
    var offset = {
      x: center.x - scale / 2,
      y: center.y - scale / 2
    };
    while (count) {
      var p1 = {
        id: NODE_ID,
        x:  random.normal() * scale + offset.x,
        y:  random.normal() * scale + offset.y
      };
      var p2 = {
        id: NODE_ID + 1,
        x:  random.normal() * scale + offset.x,
        y:  random.normal() * scale + offset.y
      };
      var e = {
        id: EDGE_ID,
        p1: p1,
        p2: p2
      };
      nodes.push(p1);
      nodes.push(p2);
      edges.push(e);
      NODE_ID += 2;
      EDGE_ID += 1;
      count -= 1;
    }
  },

  genCity: function () {
    var nodes = [];
    var edges = [];
    var c0 = {
      x: 0,
      y: 0
    };
    _.addEdges(nodes, edges, 500, 1000, c0);
    var nodesById = {};
    var edgesById = {};
    nodes.forEach(function (n) {
        nodesById[n.id] = n;
      });
    edges.forEach(function (e) {
        edgesById[e.id] = e;
      });
    var sortedX = [];
    var sortedY = [];
    nodes.forEach(function (n) {
        sortedX.push(n);
        sortedY.push(n);
      });
    sorted2d.sortX(sortedX);
    sorted2d.sortY(sortedY);
    var bounds = {
      p1: {
        x: sortedX[0].x,
        y: sortedY[0].y
      },
      p2: {
        x: sortedX[nodes.length - 1].x,
        y: sortedY[nodes.length - 1].y
      }
    };
    return {
      bounds:    bounds,
      nodes:     sortedX,
      edges:     edges,
      nodesById: nodesById,
      edgesById: edgesById
    };
  }
};
