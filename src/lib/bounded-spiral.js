"use strict";

var UnboundedSpiral = require("./unbounded-spiral");


function BoundedSpiral(firstX, firstY, lastX, lastY, offsetX, offsetY) {
  this.setBounds(firstX, firstY, lastX, lastY);
  this.source = new UnboundedSpiral(firstX, firstY);
  this.count = 0;
}

BoundedSpiral.prototype = {
  setBounds: function (firstX, firstY, lastX, lastY) {
    this.firstX = firstX;
    this.firstY = firstY;
    this.lastX  = lastX;
    this.lastY  = lastY;
    this.maxCountX = lastX - firstX + 1;
    this.maxCountY = lastY - firstY + 1;
    this.maxCount  = this.maxCountX * this.maxCountY;
  },

  resetBounds: function (firstX, firstY, lastX, lastY, offsetX, offsetY) {
    this.setBounds(firstX, firstY, lastX, lastY);
    this.source.reset(offsetX, offsetY);
    this.count = 0;
  },

  reset: function (offsetX, offsetY) {
    this.source.reset(offsetX, offsetY);
    this.count = 0;
  },

  isBounded: function (point) {
    return (
      point.x >= this.firstX &&
      point.y >= this.firstY &&
      point.x <= this.lastX &&
      point.y <= this.lastY);
  },

  next: function () {
    if (this.count < this.maxCount) {
      var point;
      do {
        point = this.source.next();
      } while (!this.isBounded(point));
      this.count++;
      return point;
    } else {
      return null;
    }
  }
};

module.exports = BoundedSpiral;
