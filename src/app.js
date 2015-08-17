"use strict";

var r = require("react-wrapper");
var mapViewer = r.wrap(require("lazy-map-viewer"));

module.exports = {
  render: function () {
    return (
      mapViewer({
          city: "London",
          tileSize: 1000,
          firstTileColumn: 488,
          lastTileColumn: 574,
          firstTileRow: 146,
          lastTileRow: 211,
          initialTileCoords: {
            x: 530,
            y: 180
          }
        }));
  }
};

r.makeComponent("App", module);
