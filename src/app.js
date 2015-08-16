"use strict";

var r = require("react-wrapper");
var lazyScroller = r.wrap(require("lazy-scroller"));
var dummy = r.wrap(require("./dummy"));

var TILE_SIZE = 1000;
var FIRST_TILE_COLUMN = 488;
var LAST_TILE_COLUMN = 574;
var TILE_COLUMN_COUNT = LAST_TILE_COLUMN - FIRST_TILE_COLUMN;
var FIRST_TILE_ROW = 146;
var LAST_TILE_ROW = 211;
var TILE_ROW_COUNT = LAST_TILE_ROW - FIRST_TILE_ROW;

function toTileCoords(x, y) {
  return {
    x: FIRST_TILE_COLUMN + x,
    y: LAST_TILE_ROW - y
  };
}

module.exports = {
  render: function () {
    return (
      lazyScroller({
          columnCount: TILE_COLUMN_COUNT,
          columnWidth: TILE_SIZE,
          rowCount: TILE_ROW_COUNT,
          rowHeight: TILE_SIZE,
          tileChild: dummy,
          tileChildProps: {
            tileSize: TILE_SIZE,
            toTileCoords: toTileCoords
          }
        }));
  }
};

r.makeComponent("App", module);
