"use strict";

var defs = require("./defs");


function TileId(lx, ly) {
  this._lx = lx;
  this._ly = ly;
}

module.exports = {
  fromLocal: function (lx, ly) {
    return new TileId(lx, ly);
  },

  fromUrl: function (s) {
    var t = s.split("-");
    return new TileId(defs.tileToLocalX(parseInt(t[0])), defs.tileToLocalY(parseInt(t[1])));
  },

  fromImageId: function (imageId) {
    return new TileId(imageId._lx, imageId._ly);
  },

  getLocalX: function (tileId) {
    return tileId._lx;
  },

  getLocalY: function (tileId) {
    return tileId._ly;
  },

  toUrl: function (tileId) {
    return defs.localToTileX(tileId._lx) + "-" + defs.localToTileY(tileId._ly);
  },

  toKey: function (tileId) {
    return tileId._lx + "?" + tileId._ly;
  }
};
