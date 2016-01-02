"use strict";

var defs = require("../defs");


var _ = module.exports = {
  fromLocal: function (lx, ly) {
    return (lx << 8) | ly;
  },

  fromTile: function (tx, ty) {
    var lx = defs.tileToLocalX(tx);
    var ly = defs.tileToLocalY(ty);
    return _.fromLocal(lx, ly);
  },

  fromKey: function (key) {
    var parts = key.split("-");
    var tx = parseInt(parts[1]);
    var ty = parseInt(parts[2]);
    return _.fromTile(tx, ty);
  },

  getLocalX: function (tileId) {
    return tileId >> 8;
  },

  getLocalY: function (tileId) {
    return tileId & 0xFF;
  },

  getTileX: function (tileId) {
    return defs.localToTileX(_.getLocalX(tileId));
  },

  getTileY: function (tileId) {
    return defs.localToTileY(_.getLocalY(tileId));
  },

  toKey: function (tileId) {
    var tx = _.getTileX(tileId);
    var ty = _.getTileY(tileId);
    return "tile-" + tx + "-" + ty;
  }
};
