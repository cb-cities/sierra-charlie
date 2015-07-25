'use strict';

var seedRandomGen = require('seedrandom');
var SUFFICIENTLY_LARGE = 3;

var _ = module.exports = {
  genUniform: seedRandomGen('', {
      state: true
    }),

  genNormal: function () {
    var sum = 0;
    for (var i = 0; i < SUFFICIENTLY_LARGE; i += 1) {
      sum += _.genUniform();
    }
    var mean = sum / SUFFICIENTLY_LARGE;
    return mean;
  },

  findLeastGreaterEqual: function (sorted, key, isLesser) {
    isLesser = isLesser || function (n, m) {
        return n < m;
      };
    function loop(min, max) {
      if (max < min || isLesser(sorted[max], key)) {
        return -1;
      }
      if (isLesser(key, sorted[min])) {
        return min;
      }
      if (min === max) {
        return min;
      }
      var mid = min + Math.floor((max - min) / 2);
      if (isLesser(sorted[mid], key)) {
        return loop(mid + 1, max);
      } else {
        return loop(min, mid);
      }
    }
    return loop(0, sorted.length - 1);
  },

  findGreatestLesserEqual: function (sorted, key, isLesser) {
    isLesser = isLesser || function (n, m) {
        return n < m;
      };
    function loop(min, max) {
      if (max < min || isLesser(key, sorted[min])) {
        return -1;
      }
      if (isLesser(sorted[max], key)) {
        return max;
      }
      if (min === max) {
        return min;
      }
      var mid = min + Math.ceil((max - min) / 2);
      if (isLesser(key, sorted[mid])) {
        return loop(min, mid - 1);
      } else {
        return loop(mid, max);
      }
    }
    return loop(0, sorted.length - 1);
  },

  selectRange: function (sorted, minKey, maxKey, isLesser) {
    var min = _.findLeastGreaterEqual(sorted, minKey, isLesser);
    if (min === -1) {
      return [];
    }
    var max = _.findGreatestLesserEqual(sorted, maxKey, isLesser);
    if (max === -1) {
      return [];
    }
    return sorted.slice(min, max + 1);
  },

  selectBounds: function (sorted, minX, minY, maxX, maxY) {
    var range = _.selectRange(sorted, minX, maxX, function (v, w) {
        return v.x < w.x;
      });
    return _.selectRange(range, minY, maxY, function (v, w) {
        return v.y < w.y;
      });
  },

  getEuclideanDistance: function (v, w) {
    var x = v.x - w.x;
    var y = v.y - w.y;
    return Math.sqrt(x * x + y * y);
  },

  getManhattanDistance: function (v, w) {
    return Math.abs(v.x - w.x) + Math.abs(v.y - w.y);
  },

  genCity: function () {
    var width        = 1000;
    var height       = 1000;
    var nodeCount    = 1000;
    var nodeDistance = 10;
    var nodes        = [];
    for (var i = 0; i < nodeCount; i += 1) {
      var v = {
        x: Math.round(_.genNormal() * width),
        y: Math.round(_.genNormal() * height)
      };
      var ws = _.selectBounds(nodes, v.x - nodeDistance, v.y - nodeDistance, v.x + nodeDistance, v.y + nodeDistance);
      if (ws.every(function (w) {
          return _.getEuclideanDistance(v, w) > nodeDistance;
        })) {
        nodes.push(v);
        nodes.sort(function (v, w) {
            return (v.x - w.x) || (v.y - w.y);
          });
      }
    }
    return {
      nodes: nodes
    };
  }
};
