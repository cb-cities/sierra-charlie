"use strict";

var defs = require("./defs");


var _ = module.exports = {
  zoomLevel: function (zoom) {
    return Math.pow(2, zoom);
  },

  groupCount: function (zoom) {
    return Math.pow(2, Math.round(zoom));
  },
  
  imageSize: function (zoom) {
    return defs.imageSize / _.zoomLevel(zoom);
  },
  
  spaceWidth: function (zoom) {
    return defs.tileXCount * _.imageSize(zoom);
  },
  
  spaceHeight: function (zoom) {
    return defs.tileYCount * _.imageSize(zoom);
  },
  
  textMargin: function (zoom) {
    return 4 * Math.sqrt(_.zoomLevel(zoom));
  },
  
  tileBorderLineWidth: function (zoom) {
    return _.zoomLevel(zoom) / window.devicePixelRatio;
  },
  
  roadLinkLineWidth: function (zoom) {
    return 4 * Math.sqrt(_.zoomLevel(zoom)) * (defs.tileSize / defs.imageSize);
  },
  
  roadNodeSquareSize: function (zoom) {
    return 8 * Math.sqrt(_.zoomLevel(zoom)) * (defs.tileSize / defs.imageSize);
  },
  
  roadNodeLineWidth: function (zoom) {
    return 2 * Math.sqrt(_.zoomLevel(zoom)) * (defs.tileSize / defs.imageSize);
  },
  
  scaleRatio: function (zoom) {
    return 1 / _.zoomLevel(zoom);
  },
  
  time: function (rawTime) {
    return (
      rawTime >= 0 ?
        Math.round((rawTime * 3600) % (24 * 3600)) / 3600 :
        24 - Math.round((-rawTime * 3600) % (24 * 3600)) / 3600);
  }
};
