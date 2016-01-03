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

  pageWidth: function (width, zoom) {
    return width / _.spaceWidth(zoom);
  },

  pageHeight: function (height, zoom) {
    return height / _.spaceHeight(zoom);
  },

  frameScrollLeft: function (left, zoom) {
    return Math.floor(left * _.spaceWidth(zoom));
  },

  frameScrollTop: function (top, zoom) {
    return Math.floor(top * _.spaceHeight(zoom));
  },

  scrollLeft: function (width, left, zoom) {
    return Math.floor(left * _.spaceWidth(zoom) - width / 2);
  },

  scrollTop: function (height, top, zoom) {
    return Math.floor(top * _.spaceHeight(zoom) - height / 2);
  },

  firstVisibleLocalX: function (width, left, zoom) {
    return clampLocalX(Math.floor(_.scrollLeft(width, left, zoom) / _.imageSize(zoom)));
  },

  firstVisibleLocalY: function (height, top, zoom) {
    return clampLocalY(Math.floor(_.scrollTop(height, top, zoom) / _.imageSize(zoom)));
  },

  lastVisibleLocalX: function (width, left, zoom) {
    return clampLocalX(Math.floor((_.scrollLeft(width, left, zoom) + width - 1) / _.imageSize(zoom)));
  },

  lastVisibleLocalY: function (height, top, zoom) {
    return clampLocalY(Math.floor((_.scrollTop(height, top, zoom) + height - 1) / _.imageSize(zoom)));
  },

  leftFromFrameScrollLeft: function (scrollLeft, zoom) {
    return scrollLeft / _.spaceWidth(zoom);
  },

  topFromFrameScrollTop: function (scrollTop, zoom) {
    return scrollTop / _.spaceHeight(zoom);
  },

  leftFromEventClientX: function (clientX, width, left, zoom) {
    return clampF((_.scrollLeft(width, left, zoom) + clientX) / _.spaceWidth(zoom));
  },

  topFromEventClientY: function (clientY, height, top, zoom) {
    return clampF((_.scrollTop(height, top, zoom) + clientY) / _.spaceHeight(zoom));
  },

  textMargin: function (zoom) {
    return 4 * Math.sqrt(_.zoomLevel(zoom));
  },

  tileBorderLineWidth: function (zoom) {
    return _.zoomLevel(zoom) / window.devicePixelRatio;
  },

  roadLinkLineWidth: function (zoom) {
    return 2 * Math.sqrt(_.zoomLevel(zoom) / 2) * (defs.tileSize / defs.imageSize);
  },

  roadNodeSquareSize: function (zoom) {
    return 8 * Math.sqrt(_.zoomLevel(zoom) / 2) * (defs.tileSize / defs.imageSize);
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
