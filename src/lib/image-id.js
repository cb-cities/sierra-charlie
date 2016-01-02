"use strict";

var defs = require("../defs");
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

  getTileX: function (imageId) {
    return defs.localToTileX(_.getLocalX(imageId));
  },

  getTileY: function (imageId) {
    return defs.localToTileY(_.getLocalY(imageId));
  },

  getTimeValue: function (imageId) {
    return (imageId >> 8) & 0xFF;
  },

  getZoomPower: function (imageId) {
    return imageId & 0xFF;
  },

  toTileId: function (imageId) {
    return tid.fromLocal(_.getLocalX(imageId), _.getLocalY(imageId));
  },

  toKey: function (imageId) {
    var tx = _.getTileX(imageId);
    var ty = _.getTileY(imageId);
    var timeValue = _.getTimeValue(imageId);
    var zoomPower = _.getZoomPower(imageId);
    return "image-" + tx + "-" + ty + "-" + timeValue + "-" + zoomPower;
  }
};
