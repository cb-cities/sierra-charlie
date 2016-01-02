"use strict";


function Rect(left, top, right, bottom) {
  this.left = left;
  this.top = top;
  this.right = right;
  this.bottom = bottom;
}

Rect.prototype = {
  width: function () {
    return this.right - this.left;
  },

  height: function () {
    return this.bottom - this.top;
  },

  contains: function (p) {
    return (
      this.left <= p.x &&
      p.x <= this.right &&
      this.top <= p.y &&
      p.y <= this.bottom);
  },

  intersects: function (rect) {
    return (
      this.left <= rect.right &&
      rect.left <= this.right &&
      this.top <= rect.bottom &&
      rect.top <= this.bottom);
  }
};

module.exports = Rect;
