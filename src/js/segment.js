"use strict";

const vector = require("./vector");


const _ = module.exports = {
  length: function (s) {
    return vector.length(vector.subtract(s.p2, s.p1));
  },

  project: function (v, s) {
    const w = vector.subtract(s.p2, s.p1);
    const len = vector.length(w);
    const ratio =
      Math.max(0,
        Math.min(
          vector.project(
            vector.subtract(v, s.p1),
            w),
          len)) / len;
    return vector.add(vector.scale(ratio, w), s.p1);
  },

  distance: function (v, s) {
    return vector.distance(v, _.project(v, s));
  },

  bounds: function (margin, s) {
    return {
      left: Math.min(s.p1.x, s.p2.x) - margin,
      top: Math.min(s.p1.y, s.p2.y) - margin,
      right: Math.max(s.p1.x, s.p2.x) + margin,
      bottom: Math.max(s.p1.y, s.p2.y) + margin
    };
  },

  midpoint: function (s) {
    return {
      x: (s.p1.x + s.p2.x) / 2,
      y: (s.p1.y + s.p2.y) / 2
    };
  }
};
