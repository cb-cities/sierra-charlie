"use strict";

var tid = require("./tile-id");


var _ = module.exports = {
  fromLocal: function (lx, ly, timeValue, zoomPower) {
    return (lx << 24) | (ly << 16) | (timeValue << 8) | zoomPower;
  },

  fromTileId: function (tileId, timeValue, zoomPower) {
    return (tileId << 16) | (timeValue << 8) | zoomPower;
  },

  getLocalX: function (imageId) {
    return imageId >> 24;
  },

  getLocalY: function (imageId) {
    return (imageId >> 16) & 0xFF;
  },

  getTimeValue: function (imageId) {
    return (imageId >> 8) & 0xFF;
  },

  getZoomPower: function (imageId) {
    return imageId & 0xFF;
  },

  toTileId: function (imageId) {
    return tid.fromLocal(_.getLocalX(imageId), _.getLocalY(imageId));
  }
};
