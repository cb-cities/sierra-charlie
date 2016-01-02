"use strict";


var _ = module.exports = {
  fromTileGroup: function (tgx, tgy) {
    return (tgx << 8) | tgy;
  },

  fromTile: function (tx, ty) {
    var tgx = Math.floor(tx / 10);
    var tgy = Math.floor(ty / 10);
    return _.fromTileGroup(tgx, tgy);
  },

  fromKey: function (key) {
    var parts = key.split("-");
    var tgx = parseInt(parts[2]);
    var tgy = parseInt(parts[3]);
    return _.fromTileGroup(tgx, tgy);
  },

  fromFileName: function (fileName) {
    return _.fromKey(fileName);
  },

  getTileGroupX: function (tileGroupId) {
    return tileGroupId >> 8;
  },

  getTileGroupY: function (tileGroupId) {
    return tileGroupId & 0xFF;
  },

  toFirstTileX: function (tileGroupId) {
    var tgx = _.getTileGroupX(tileGroupId);
    var tx = tgx * 10;
    return tx;
  },

  toLastTileX: function (tileGroupId) {
    return _.toFirstTileX(tileGroupId) + 9;
  },

  toFirstTileY: function (tileGroupId) {
    var tgy = _.getTileGroupY(tileGroupId);
    var ty = tgy * 10;
    return ty;
  },

  toLastTileY: function (tileGroupId) {
    return _.toFirstTileY(tileGroupId) + 9;
  },

  toKey: function (tileGroupId) {
    var tgx = _.getTileGroupX(tileGroupId);
    var tgy = _.getTileGroupY(tileGroupId);
    return "tile-group-" + tgx + "-" + tgy;
  },

  toFileName: function (tileGroupId) {
    return _.toKey(tileGroupId) + ".json.gz";
  },

  toUrl: function (origin, tileGroupId) {
    return origin + "/json/" + _.toFileName(tileGroupId);
  }
};
