'use strict';

var random = require('./common/random');
var sorted2d = require('./common/sorted2d');
var vec = require('./common/vector');
var seg = require('./common/segment');

var _ = module.exports = {
  cityWidth:  1000,
  cityHeight: 1000,
  nodeCount:  1000,
  edgeCount:  1000,
  emptyArea:  10,

  acceptNode: function (nodes, node) {
    var bounds = vec.bound(node, _.emptyArea);
    var boundedNodes = sorted2d.between(nodes, bounds.p, bounds.q);
    return boundedNodes.every(function (boundedNode) {
        return vec.dist(node, boundedNode) > _.emptyArea;
      });
  },

  acceptEdge: function (nodes, edge) {
    var bounds = seg.bound(edge, _.emptyArea);
    var boundedNodes = sorted2d.between(nodes, bounds.p, bounds.q);
    return boundedNodes.every(function (boundedNode) {
        return (
          boundedNode === edge.p ||
          boundedNode === edge.q ||
          seg.dist(boundedNode, edge) > _.emptyArea);
      });
  },

  genNodes: function () {
    var nodes = [];
    for (var i = 0; i < _.nodeCount; i += 1) {
      var p = {
        x: Math.round(random.normal() * _.cityWidth),
        y: Math.round(random.normal() * _.cityHeight)
      };
      if (_.acceptNode(nodes, p)) {
        nodes.push(p);
        sorted2d.sortX(nodes);
      }
    }
    return nodes;
  },

  genEdges: function (nodes) {
    var edges = [];
    nodes.forEach(function (p) {
        p.nodes = nodes.filter(function (q) {
            return p !== q;
          }).sort(function (q1, q2) {
            return vec.dist(p, q1) - vec.dist(p, q2);
          });
        p.edges = [];
      });
    for (var i = 0; i < _.edgeCount; i += 1) {
      var v = nodes[Math.floor(random.uniform() * nodes.length)];
      if (v.edges.length > 0) {
        continue;
      }
      var w;
      for (var j = 0; j < v.nodes.length; j += 1) {
        if (v.nodes[j].edges.length < 1) {
          w = v.nodes[j];
          break;
        }
      }
      if (!w) {
        continue;
      }
      var e = {
        p: v,
        q: w
      };
      if (_.acceptEdge(nodes, e)) {
        v.edges.push(e);
        w.edges.push(e);
        edges.push(e);
      }
    }
    return edges;
  },

  genCity: function () {
    var nodes = _.genNodes();
    var edges = _.genEdges(nodes);
    return {
      nodes: nodes,
      edges: edges
    };
  }
};
