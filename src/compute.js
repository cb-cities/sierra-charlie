"use strict";

var defs = require("./defs");


function clampF(f) {
  return (
    Math.max(0,
      Math.min(f, 1)));
}

function clampLocalX(lx) {
  return (
    Math.max(0,
      Math.min(lx, defs.tileXCount - 1)));
}

function clampLocalY(ly) {
  return (
    Math.max(0,
      Math.min(ly, defs.tileYCount - 1)));
}


var _ = module.exports = {
  localX: function (left) {
    return Math.floor(left * defs.tileXCount);
  },
  
  localY: function (top) {
    return Math.floor(top * defs.tileYCount);
  },
  
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
  
  pageWidth: function (clientWidth, zoom) {
    return clientWidth / _.spaceWidth(zoom);
  },
  
  pageHeight: function (clientHeight, zoom) {
    return clientHeight / _.spaceHeight(zoom);
  },
  
  scrollLeft: function (left, zoom) {
    return Math.floor(left * _.spaceWidth(zoom));
  },
  
  scrollTop: function (top, zoom) {
    return Math.floor(top * _.spaceHeight(zoom));
  },
  
  scrollLeftAndHalf: function (clientWidth, left, zoom) {
    return Math.floor(left * _.spaceWidth(zoom) - clientWidth / 2);
  },
  
  scrollTopAndHalf: function (clientHeight, top, zoom) {
    return Math.floor(top * _.spaceHeight(zoom) - clientHeight / 2);
  },
  
  firstVisibleLocalX: function (clientWidth, left, zoom) {
    return clampLocalX(Math.floor(_.scrollLeftAndHalf(clientWidth, left, zoom) / _.imageSize(zoom)));
  },
  
  firstVisibleLocalY: function (clientHeight, top, zoom) {
    return clampLocalY(Math.floor(_.scrollTopAndHalf(clientHeight, top, zoom) / _.imageSize(zoom)));
  },
  
  lastVisibleLocalX: function (clientWidth, left, zoom) {
    return clampLocalX(Math.floor((_.scrollLeftAndHalf(clientWidth, left, zoom) + clientWidth - 1) / _.imageSize(zoom)));
  },
  
  lastVisibleLocalY: function (clientHeight, top, zoom) {
    return clampLocalY(Math.floor((_.scrollTopAndHalf(clientHeight, top, zoom) + clientHeight - 1) / _.imageSize(zoom)));
  },
  
  fromClientX: function (clientX, clientWidth, left, zoom) {
    return clampF((_.scrollLeftAndHalf(clientWidth, left, zoom) + clientX) / _.spaceWidth(zoom));
  },
  
  fromClientY: function (clientY, clientHeight, top, zoom) {
    return clampF((_.scrollTopAndHalf(clientHeight, top, zoom) + clientY) / _.spaceHeight(zoom));
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
