"use strict";

const Lineset = require("./Lineset");

const defs = require("./defs");


function Grid() {
  const left = defs.firstTileX;
  const top = defs.firstTileY;
  const right = left + defs.totalWidth;
  const bottom = top + defs.totalHeight;
  this.gridLines = new Lineset();
  for (let i = 0; i <= defs.tileCountX; i++) {
    const x = defs.firstTileX + i * defs.tileSize;
    this.gridLines.insertLine([x, top], [x, bottom]);
  }
  for (let j = 0; j <= defs.tileCountY; j++) {
    const y = defs.firstTileY + j * defs.tileSize;
    this.gridLines.insertLine([left, y], [right, y]);
  }
}

Grid.prototype = {
  render: function (gl) {
    this.gridLines.render(gl, gl.STATIC_DRAW);
  },

  draw: function (gl, vertexLoc) {
    this.gridLines.draw(gl, vertexLoc);
  }
};

module.exports = Grid;
