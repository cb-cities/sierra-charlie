"use strict";


var _ = module.exports = {
  add: function (v, w) {
    return {
      x: v.x + w.x,
      y: v.y + w.y
    };
  },

  subtract: function (v, w) {
    return {
      x: v.x - w.x,
      y: v.y - w.y
    };
  },

  dot: function (v, w) {
    return v.x * w.x + v.y * w.y;
  },

  // NOTE: http://mathworld.wolfram.com/PerpDotProduct.html
  perpDot: function (v, w) {
    return v.x * w.y - v.y * w.x;
  },

  multiply: function (a, v) {
    return {
      x: a * v.x,
      y: a * v.y
    };
  },

  length: function (v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  project: function (v, w) {
    return _.dot(v, w) / _.len(w);
  },

  distance: function (v, w) {
    return _.len(_.sub(v, w));
  },

  bounds: function (v, d) {
    return {
      p1: {
        x: v.x - d,
        y: v.y - d
      },
      p2: {
        x: v.x + d,
        y: v.y + d
      }
    };
  }
};
