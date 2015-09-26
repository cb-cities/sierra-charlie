"use strict";


function ImageId(lx, ly, zoomPower) {
  this._lx = lx;
  this._ly = ly;
  this._zoomPower = zoomPower;
}

module.exports = {
  fromLocal: function (lx, ly, zoomPower) {
    return new ImageId(lx, ly, zoomPower);
  },

  fromTileId: function (tileId, zoomPower) {
    return new ImageId(tileId._lx, tileId._ly, zoomPower);
  },

  getLocalX: function (imageId) {
    return imageId._lx;
  },

  getLocalY: function (imageId) {
    return imageId._ly;
  },

  getZoomPower: function (imageId) {
    return imageId._zoomPower;
  },

  toKey: function (imageId) {
    return imageId._lx + "!" + imageId._ly + "!" + imageId._zoomPower;
  }
};
