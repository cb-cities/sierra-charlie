"use strict";

var Lineset = require("./lineset");

var defs = require("./defs");


function Grid() {
  var left = defs.firstTileX;
  var top = defs.firstTileY;
  var right = left + defs.totalWidth;
  var bottom = top + defs.totalHeight;
  this.gridLines = new Lineset();
  for (var i = 0; i <= defs.tileCountX; i++) {
    var x = defs.firstTileX + i * defs.tileSize;
    this.gridLines.insertLine(x, top, x, bottom);
  }
  for (var i = 0; i <= defs.tileCountY; i++) {
    var y = defs.firstTileY + i * defs.tileSize;
    this.gridLines.insertLine(left, y, right, y);
  }
}

Grid.prototype = {
  render: function (gl) {
    this.gridLines.render(gl, gl.STATIC_DRAW);
  },

  draw: function (gl, positionLoc) {
    this.gridLines.draw(gl, positionLoc);
  }
};

module.exports = Grid;
