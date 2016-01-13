"use strict";


const _ = module.exports = {
  invalid: {
    left: Infinity,
    top: Infinity,
    right: -Infinity,
    bottom: -Infinity
  },

  width: function (r) {
    return r.right - r.left;
  },

  height: function (r) {
    return r.bottom - r.top;
  },

  contains: function (r, p) {
    return (
      r.left <= p[0] &&
      p[0] <= r.right &&
      r.top <= p[1] &&
      p[1] <= r.bottom);
  },

  intersects: function (r1, r2) {
    return (
      r1.left <= r2.right &&
      r2.left <= r1.right &&
      r1.top <= r2.bottom &&
      r2.top <= r1.bottom);
  },

  bounds: function (margin, r) {
    return {
      left: r.left - margin,
      top: r.top - margin,
      right: r.right + margin,
      bottom: r.bottom + margin
    };
  },

  midpoint: function (r) {
    return [
      r.left + _.width(r) / 2,
      r.top + _.height(r) / 2
    ];
  },

  stretch: function (r, p) {
    return {
      left: Math.min(r.left, p[0]),
      top: Math.min(r.top, p[1]),
      right: Math.max(r.right, p[0]),
      bottom: Math.max(r.bottom, p[1])
    };
  },

  union: function (r1, r2) {
    return {
      left: Math.min(r1.left, r2.left),
      top: Math.min(r1.top, r2.top),
      right: Math.max(r1.right, r2.right),
      bottom: Math.max(r1.bottom, r2.bottom)
    };
  }
};
