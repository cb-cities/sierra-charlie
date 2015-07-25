'use strict';

var vec = require('./vector');

var _ = module.exports = {
  proj: function (v, s) {
    var w = vec.sub(s.q, s.p);
    var l = vec.len(w);
    var a = Math.max(0, Math.min(vec.proj(vec.sub(v, s.p), w), l)) / l;
    return vec.add(vec.mul(a, w), s.p);
  },

  dist: function (v, s) {
    return vec.dist(v, _.proj(v, s));
  },

  bound: function (s, d) {
    return {
      p: {
        x: Math.min(s.p.x, s.q.x) - d,
        y: Math.min(s.p.y, s.q.y) - d
      },
      q: {
        x: Math.max(s.p.x, s.q.x) + d,
        y: Math.max(s.p.y, s.q.y) + d
      }
    };
  }
};
