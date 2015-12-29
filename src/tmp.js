"use strict";

var defs = require("./defs");


var _ = module.exports = {
  computeZoomLevel: function (zoom) {
    return Math.pow(2, zoom);
  },

  computeGroupCount: function (zoom) {
    return Math.pow(2, Math.round(zoom));
  },
  
  computeImageSize: function (zoom) {
    return defs.imageSize / _.computeZoomLevel(zoom);
  },
  
  computeTextMargin: function (zoom) {
    return 4 * Math.sqrt(_.computeZoomLevel(zoom));
  },
  
  computeTileBorderLineWidth: function (zoom) {
    return _.computeZoomLevel(zoom) / window.devicePixelRatio;
  },
  
  computeRoadLinkLineWidth: function (zoom) {
    return 4 * Math.sqrt(_.computeZoomLevel(zoom)) * (defs.tileSize / defs.imageSize);
  },
  
  computeRoadNodeSquareSize: function (zoom) {
    return 8 * Math.sqrt(_.computeZoomLevel(zoom)) * (defs.tileSize / defs.imageSize);
  },
  
  computeRoadNodeLineWidth: function (zoom) {
    return 2 * Math.sqrt(_.computeZoomLevel(zoom)) * (defs.tileSize / defs.imageSize);
  },
  
  computeScaleRatio: function (zoom) {
    return 1 / _.computeZoomLevel(zoom);
  },
  
  computeTime: function (rawTime) {
    return (
      rawTime >= 0 ?
        Math.round((rawTime * 3600) % (24 * 3600)) / 3600 :
        24 - Math.round((-rawTime * 3600) % (24 * 3600)) / 3600);
  }
};
