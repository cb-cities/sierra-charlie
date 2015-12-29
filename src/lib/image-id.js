"use strict";

var defs = require("../defs");
var tid = require("./tile-id");


var _ = module.exports = {
  fromLocal: function (lx, ly, timeSignal, zoomSignal) {
    return (lx << 24) | (ly << 16) | (timeSignal << 8) | zoomSignal;
  },

  fromTileId: function (tileId, timeSignal, zoomSignal) {
    return (tileId << 16) | (timeSignal << 8) | zoomSignal;
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

  getTimeSignal: function (imageId) {
    return (imageId >> 8) & 0xFF;
  },

  getZoomSignal: function (imageId) {
    return imageId & 0xFF;
  },

  toTileId: function (imageId) {
    return tid.fromLocal(_.getLocalX(imageId), _.getLocalY(imageId));
  },

  toKey: function (imageId) {
    var tx = _.getTileX(imageId);
    var ty = _.getTileY(imageId);
    var timeSignal = _.getTimeSignal(imageId);
    var zoomSignal = _.getZoomSignal(imageId);
    return "image-" + tx + "-" + ty + "-" + timeSignal + "-" + zoomSignal;
  }
};
