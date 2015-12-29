"use strict";


function Bounds(startX, startY, endX, endY) {
  this.startX = startX;
  this.startY = startY;
  this.endX   = endX;
  this.endY   = endY;
}

Bounds.prototype = {
  width: function () {
    return this.endX - this.startX;
  },

  height: function () {
    return this.endY - this.startY;
  },

  contain: function (point) {
    return (
      point.x >= this.startX &&
      point.y >= this.startY &&
      point.x < this.endX &&
      point.y < this.endY);
  },

  intersect: function (bounds) {
    return (
      this.startX < bounds.endX &&
      this.startY < bounds.endY &&
      this.endX >= bounds.startX &&
      this.endY >= bounds.startY);
  }
};

module.exports = Bounds;
