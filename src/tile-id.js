"use strict";

var defs = require("./defs");


function TileId(lx, ly) {
  this._lx = lx;
  this._ly = ly;
}

TileId.prototype.toUrl = function () {
  return this.getTileX() + "-" + this.getTileY();
};

TileId.prototype.toString = function () {
  return this._lx + "?" + this._ly;
};

TileId.prototype.getLocalX = function () {
  return this._lx;
};

TileId.prototype.getLocalY = function () {
  return this._ly;
};

TileId.prototype.getTileX = function () {
  return defs.localToTileX(this._lx);
};

TileId.prototype.getTileY = function () {
  return defs.localToTileY(this._ly);
};

module.exports = {
  TileId: TileId,

  fromUrl: function (s) {
    var t = s.split("-");
    return new TileId(defs.tileToLocalX(parseInt(t[0])), defs.tileToLocalY(parseInt(t[1])));
  },

  fromImageId: function (imageId) {
    return new TileId(imageId.getLocalX(), imageId.getLocalY());
  }
};
