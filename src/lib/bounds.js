"use strict";


function Bounds(startX, endX, startY, endY) {
  this.startX = startX;
  this.endX   = endX;
  this.startY = startY;
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
      point.x < this.endX &&
      point.y >= this.startY &&
      point.y < this.endY);
  },

  intersect: function (bounds) {
    return (
      this.startX < bounds.endX &&
      this.endX   >=  bounds.startX &&
      this.startY < bounds.endY &&
      this.endY   >=  bounds.startY);
  }
};

module.exports = Bounds;
