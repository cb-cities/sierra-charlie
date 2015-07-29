'use strict';

var utils = require('./common/utils');
var random = require('./common/random');
var sorted2d = require('./common/sorted2d');
var vec = require('./common/vector');
var seg = require('./common/segment');

var NODE_ID = 0;
var EDGE_ID = 0;

var _ = module.exports = {
  acceptNode: function (nodes, edges, spacing, n) {
    var bounds       = vec.bound(n, spacing);
    var boundedNodes = sorted2d.between(nodes, bounds.p, bounds.q);
    return (
      boundedNodes.every(function (n0) {
          return vec.dist(n, n0) > spacing;
        }) &&
      edges.every(function (e) {
          return e.type === 'underground' || seg.dist(n, e) > spacing;
        }));
  },

  acceptEdge: function (nodes, edges, spacing, e) {
    var bounds       = seg.bound(e, spacing);
    var boundedNodes = sorted2d.between(nodes, bounds.p, bounds.q);
    return (
      boundedNodes.every(function (n0) {
          return (
            e.p === n0 ||
            e.q === n0 ||
            seg.dist(n0, e) > spacing);
        }) &&
      edges.every(function (e0) {
          return (
            e.p === e0.p ||
            e.p === e0.q ||
            e.q === e0.p ||
            e.q === e0.q ||
            (e.type === 'underground') !== (e0.type === 'underground') ||
            seg.intersect(e, e0).result === 'none');
        }));
  },

  addNodes: function (nodes, edges, count, scale, center, spacing, base) {
    var offset = {
      x: center.x - scale / 2,
      y: center.y - scale / 2
    };
    var maxRejects = count;
    var rejects    = 0;
    while (count && rejects < maxRejects) {
      var n = utils.assign({
          id:        NODE_ID,
          x:         random.normal() * scale + offset.x,
          y:         random.normal() * scale + offset.y,
          neighbors: []
        },
        base);
      if (_.acceptNode(nodes, edges, spacing, n)) {
        nodes.push(n);
        NODE_ID += 1;
        count -= 1;
        sorted2d.sortX(nodes);
      } else {
        rejects += 1;
      }
    }
    if (count) {
      console.log('Could not add nodes:', count);
    }
  },

  addEdges: function (nodes, edges, count, spacing, maxNeighbors, base) {
    var potentialNodes = [];
    nodes.forEach(function (n0) {
        if (n0.neighbors.length < maxNeighbors) {
          potentialNodes.push(n0);
        }
      });
    var maxRejects = count;
    var rejects    = 0;
    while (count && rejects < maxRejects && potentialNodes.length) {
      potentialNodes = potentialNodes.filter(function (n0) {
          return n0.neighbors.length < maxNeighbors;
        });
      potentialNodes.sort(function (n1, n2) {
          return n1.neighbors.length - n2.neighbors.length;
        });
      var n = potentialNodes[rejects % potentialNodes.length];
      var closestNodes = potentialNodes.filter(function (n0) {
          return (
            n0 !== n &&
            n0.neighbors.every(function (n1) {
                return (
                  n1 !== n &&
                  n1.neighbors.indexOf(n) === -1);
              }));
        }).sort(function (n1, n2) {
          return vec.dist(n, n1) - vec.dist(n, n2);
        });
      var accepted = false;
      for (var j = 0; j < closestNodes.length; j += 1) {
        var e = utils.assign({
            id: EDGE_ID,
            p:  n,
            q:  closestNodes[j]
          },
          base);
        if (_.acceptEdge(nodes, edges, spacing, e)) {
          e.p.neighbors.push(e.q);
          e.q.neighbors.push(e.p);
          edges.push(e);
          EDGE_ID += 1;
          count -= 1;
          accepted = true;
          break;
        }
      }
      if (!accepted) {
        rejects += 1;
      }
    }
    if (count) {
      console.log('Could not add edges:', count);
    }
  },

  genCity: function () {
    var nodes = [];
    var edges = [];
    var c0    = {
      x: 0,
      y: 0
    };
    _.addNodes(nodes, edges, 15, 1000, c0, 100);
    _.addEdges(nodes, edges, 15, 100, 3, {type: 'underground'});
    var centers = [];
    nodes.forEach(function (n) {
        centers.push({
            x: n.x,
            y: n.y
          });
      });
    centers.forEach(function (c) {
        _.addNodes(nodes, edges, 10, 1000, c, 50);
      });
    _.addEdges(nodes, edges, 100, 50, 3, {type: 'a-road'});
    centers.forEach(function (c) {
        _.addNodes(nodes, edges, 25, 1000, c, 25);
      });
    _.addEdges(nodes, edges, 250, 25, 3, {type: 'b-road'});
    centers.forEach(function (c) {
        _.addNodes(nodes, edges, 50, 1000, c, 10);
      });
    _.addEdges(nodes, edges, 1000, 10, 4);
    var nodesById = {};
    var edgesById = {};
    nodes.forEach(function (n) {
        nodesById[n.id] = n;
      });
    edges.forEach(function (e) {
        edgesById[e.id] = e;
      });
    var sortedY = [];
    nodes.forEach(function (n) {
        sortedY.push(n);
      });
    sorted2d.sortY(sortedY);
    var bounds = {
      p: {
        x: nodes[0].x,
        y: sortedY[0].y
      },
      q: {
        x: nodes[nodes.length - 1].x,
        y: sortedY[sortedY.length - 1].y
      }
    };
    return {
      bounds:    bounds,
      nodes:     nodes,
      edges:     edges,
      nodesById: nodesById,
      edgesById: edgesById
    };
  }
};
