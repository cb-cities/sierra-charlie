"use strict";

var Lineset = require("./lineset");


function Grid(props) {
  this.props = props;
  var left = this.props.firstTileX * this.props.tileSize;
  var top = this.props.firstTileY * this.props.tileSize;
  var right = (this.props.lastTileX + 1) * this.props.tileSize;
  var bottom = (this.props.lastTileY + 1) * this.props.tileSize;
  this.gridLines = new Lineset();
  for (var x = left; x <= right; x += this.props.tileSize) {
    this.gridLines.insertLine(x, top, x, bottom);
  }
  for (var y = bottom; y >= top; y -= this.props.tileSize) {
    this.gridLines.insertLine(left, y, right, y);
  }
}

Grid.prototype = {
  render: function (gl) {
    this.gridLines.render(gl, gl.STATIC_DRAW);
  },

  draw: function (gl, positionLoc, colorLoc) {
    gl.lineWidth(1);
    gl.uniform4f(colorLoc, 0.2, 0.2, 0.2, 1);
    this.gridLines.draw(gl, positionLoc);
  }
};

module.exports = Grid;
