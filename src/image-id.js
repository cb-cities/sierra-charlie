"use strict";

var tid = require("./tile-id");


var _ = module.exports = {
  fromLocal: function (lx, ly, zoomPower) {
    return (lx << 16) | (ly << 8) | zoomPower;
  },

  fromTileId: function (tileId, zoomPower) {
    return (tileId << 8) | zoomPower;
  },

  getLocalX: function (imageId) {
    return imageId >> 16;
  },

  getLocalY: function (imageId) {
    return (imageId >> 8) & 0xFF;
  },

  getZoomPower: function (imageId) {
    return imageId & 0xFF;
  },

  toTileId: function (imageId) {
    return tid.fromLocal(_.getLocalX(imageId), _.getLocalY(imageId));
  }
};
