'use strict';

var _ = module.exports = {
  add: function (v, w) {
    return {
      x: v.x + w.x,
      y: v.y + w.y
    };
  },

  sub: function (v, w) {
    return {
      x: v.x - w.x,
      y: v.y - w.y
    };
  },

  dot: function (v, w) {
    return v.x * w.x + v.y * w.y;
  },

  mul: function (a, v) {
    return {
      x: a * v.x,
      y: a * v.y
    };
  },

  len: function (v) {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  proj: function (v, w) {
    return _.dot(v, w) / _.len(w);
  },

  dist: function (v, w) {
    return _.len(_.sub(v, w));
  },

  bound: function (v, d) {
    return {
      p: {
        x: v.x - d,
        y: v.y - d
      },
      q: {
        x: v.x + d,
        y: v.y + d
      }
    };
  }
};
