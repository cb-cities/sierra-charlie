"use strict";


const _ = module.exports = {
  add: function (v1, v2) {
    return [
      v1[0] + v2[0],
      v1[1] + v2[1]
    ];
  },

  subtract: function (v1, v2) {
    return [
      v1[0] - v2[0],
      v1[1] - v2[1]
    ];
  },

  dot: function (v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1];
  },

  perpDot: function (v1, v2) { // perpendicular dot product
    return v1[0] * v2[1] - v1[1] * v2[0];
  },

  scale: function (ratio, v) {
    return [
      ratio * v[0],
      ratio * v[1]
    ];
  },

  length: function (v) {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
  },

  project: function (v1, v2) {
    return _.dot(v1, v2) / _.length(v2);
  },

  distance: function (v1, v2) {
    return _.length(_.subtract(v1, v2));
  },

  bounds: function (margin, v) {
    return {
      left: v[0] - margin,
      top: v[1] - margin,
      right: v[0] + margin,
      bottom: v[1] + margin
    };
  }
};
