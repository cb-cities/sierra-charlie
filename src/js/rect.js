"use strict";


module.exports = {
  width: function (r) {
    return r.right - r.left;
  },

  height: function (r) {
    return r.bottom - r.top;
  },

  contains: function (r, p) {
    return (
      r.left <= p.x &&
      p.x <= r.right &&
      r.top <= p.y &&
      p.y <= r.bottom);
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
      bottom: ri.bottom + margin
    };
  },

  stretch: function (r, p) {
    return {
      left: Math.min(r.left, p.x),
      top: Math.min(r.top, p.y),
      right: Math.max(r.right, p.x),
      bottom: Math.max(r.bottom, p.y)
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
