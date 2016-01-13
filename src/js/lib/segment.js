"use strict";

const vector = require("./vector");


const _ = module.exports = {
  length: function (s) {
    return vector.length(vector.subtract(s[1], s[0]));
  },

  project: function (v, s) {
    const w = vector.subtract(s[1], s[0]);
    const len = vector.length(w);
    const ratio =
      Math.max(0,
        Math.min(
          vector.project(
            vector.subtract(v, s[0]),
            w),
          len)) / len;
    return vector.add(vector.scale(ratio, w), s[0]);
  },

  distance: function (v, s) {
    return vector.distance(v, _.project(v, s));
  },

  bounds: function (margin, s) { // TODO: Speed up
    return {
      left: Math.min(s[0][0], s[1][0]) - margin,
      top: Math.min(s[0][1], s[1][1]) - margin,
      right: Math.max(s[0][0], s[1][0]) + margin,
      bottom: Math.max(s[0][1], s[1][1]) + margin
    };
  },

  midpoint: function (s) {
    return [
      (s[0][0] + s[1][0]) / 2,
      (s[0][1] + s[1][1]) / 2
    ];
  }
};
