"use strict";

function ImageId(tx, ty, tz) {
  this.tx = tx;
  this.ty = ty;
  this.tz = tz;
}

ImageId.prototype.toString = function () {
  return this.tx + "-" + this.ty + "-" + this.tz;
};

module.exports = ImageId;
