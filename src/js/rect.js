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
  }
};
