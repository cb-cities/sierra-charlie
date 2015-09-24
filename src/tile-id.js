"use strict";

function TileId(tx, ty) {
  this.tx = tx;
  this.ty = ty;
}

TileId.prototype.toString = function () {
  return this.tx + "-" + this.ty;
};

module.exports = TileId;
