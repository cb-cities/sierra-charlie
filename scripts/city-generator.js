'use strict';

var random = require('./common/random');
var sorted2d = require('./common/sorted2d');
var vec = require('./common/vector');
var seg = require('./common/segment');

var _ = module.exports = {
  acceptNode: function (nodes, edges, spacing, n) {
    var bounds       = vec.bound(n, spacing);
    var boundedNodes = sorted2d.between(nodes, bounds.p, bounds.q);
    return (
      boundedNodes.every(function (n0) {
          return vec.dist(n, n0) > spacing;
        }) &&
      edges.every(function (e) {
          return seg.dist(n, e) > spacing;
        }));
  },

  acceptEdge: function (nodes, edges, spacing, e) {
    var bounds       = seg.bound(e, spacing);
    var boundedNodes = sorted2d.between(nodes, bounds.p, bounds.q);
    return (
      boundedNodes.every(function (n) {
          return (
            e.p === n ||
            e.q === n ||
            seg.dist(n, e) > spacing);
        }) &&
      edges.every(function (e0) {
          return (
            e.p === e0.p ||
            e.p === e0.q ||
            e.q === e0.p ||
            e.q === e0.q ||
            seg.intersect(e, e0).result === 'none');
        }));
  },

  addNodes: function (nodes, edges, count, scale, offset, spacing) {
    for (var i = 0; i < count; i += 1) {
      var n = {
        x: random.normal() * scale.x + offset.x,
        y: random.normal() * scale.y + offset.y
      };
      if (_.acceptNode(nodes, edges, spacing, n)) {
        nodes.push(n);
        sorted2d.sortX(nodes);
      }
    }
  },

  addEdges: function (nodes, edges, count, spacing) {
    nodes.forEach(function (n) {
        n.closest = nodes.filter(function (n0) {
            return n !== n0;
          }).sort(function (n1, n2) {
            return vec.dist(n, n1) - vec.dist(n, n2);
          });
        n.neighbors = [];
      });
    edges.forEach(function (e) {
        e.p.neighbors.push(e.q);
        e.q.neighbors.push(e.p);
      });
    for (var i = 0; i < count; i += 1) {
      var n1 = nodes[Math.floor(random.uniform() * nodes.length)];
      var n2;
      for (var j = 0; j < n1.closest.length; j += 1) {
        if (n1.neighbors.indexOf(n1.closest[j]) === -1) {
          n2 = n1.closest[j];
          break;
        }
      }
      if (!n2) {
        continue;
      }
      var e = {
        p: n1,
        q: n2
      };
      if (_.acceptEdge(nodes, edges, spacing, e)) {
        e.p.neighbors.push(e.q);
        e.q.neighbors.push(e.p);
        edges.push(e);
      }
    }
    nodes.forEach(function (n) {
        n.closest   = undefined;
        n.neighbors = undefined;
      });
  },

  genCity: function () {
    var nodes = [];
    var edges = [];
    _.addNodes(nodes, edges, 1000, {x: 1000, y: 1000}, {x: 0, y: 0}, 10);
    _.addEdges(nodes, edges, 10000, 10);
    return {
      nodes: nodes,
      edges: edges
    };
  }
};
