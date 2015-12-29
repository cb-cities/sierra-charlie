"use strict";

var defs = require("../defs");
var tid = require("./tile-id");


var _ = module.exports = {
  fromLocal: function (lx, ly, time, zoom) {
    return (lx << 24) | (ly << 16) | (time << 8) | zoom;
  },

  fromTileId: function (tileId, time, zoom) {
    return (tileId << 16) | (time << 8) | zoom;
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

  getTime: function (imageId) {
    return (imageId >> 8) & 0xFF;
  },

  getZoom: function (imageId) {
    return imageId & 0xFF;
  },

  toTileId: function (imageId) {
    return tid.fromLocal(_.getLocalX(imageId), _.getLocalY(imageId));
  },

  toKey: function (imageId) {
    var tx = _.getTileX(imageId);
    var ty = _.getTileY(imageId);
    var time = _.getTime(imageId);
    var zoom = _.getZoom(imageId);
    return "image-" + tx + "-" + ty + "-" + time + "-" + zoom;
  }
};
