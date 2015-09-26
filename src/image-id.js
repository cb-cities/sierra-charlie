"use strict";

function ImageId(tx, ty, zoomPower) {
  this._tx = tx;
  this._ty = ty;
  this._zoomPower = zoomPower;
}

ImageId.prototype.toString = function () {
  return this._tx + "!" + this._ty + "!" + this._zoomPower;
};

ImageId.prototype.getTileX = function () {
  return this._tx;
};

ImageId.prototype.getTileY = function () {
  return this._ty;
};

ImageId.prototype.getZoomPower = function () {
  return this._zoomPower;
};

module.exports = {
  ImageId: ImageId
};
