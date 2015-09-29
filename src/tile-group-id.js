"use strict";

var tid = require("./tile-id");


var _ = module.exports = {
  fromTileId: function (tileId) {
    var tx = tid.getTileX(tileId);
    var ty = tid.getTileY(tileId);
    var tgx = Math.floor(tx / 10);
    var tgy = Math.floor(ty / 10);
    return (tgx << 8) | tgy;
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

  toUrl: function (origin, tileGroupId) {
    var tgx = _.getTileGroupX(tileGroupId);
    var tgy = _.getTileGroupY(tileGroupId);
    return origin + "/json/tile-group-" + tgx + "-" + tgy + ".json.gz";
  }
};
