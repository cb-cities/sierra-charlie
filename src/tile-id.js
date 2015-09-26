"use strict";

function TileId(tx, ty) {
  this._tx = tx;
  this._ty = ty;
}

TileId.prototype.toUrl = function () {
  return this._tx + "-" + this._ty;
};

TileId.prototype.toString = function () {
  return this._tx + "?" + this._ty;
};

TileId.prototype.getTileX = function () {
  return this._tx;
};

TileId.prototype.getTileY = function () {
  return this._ty;
};

module.exports = {
  TileId: TileId,

  fromUrl: function (s) {
    var t = s.split("-");
    return new TileId(parseInt(t[0]), parseInt(t[1]));
  }
};
