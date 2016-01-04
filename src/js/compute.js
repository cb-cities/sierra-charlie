"use strict";

var defs = require("./defs");


var _ = module.exports = {
  clamp: function (value) {
    return (Math.max(0, Math.min(value, 1)));
  },
  
  clientSpaceWidth: function (zoom) {
    return defs.tileCountX * defs.clientTileSize / _.zoomLevel(zoom);
  },

  clientSpaceHeight: function (zoom) {
    return defs.tileCountY * defs.clientTileSize / _.zoomLevel(zoom);
  },
  
  clientPageWidth: function (width, zoom) {
    return width / _.clientSpaceWidth(zoom);
  },

  clientPageHeight: function (height, zoom) {
    return height / _.clientSpaceHeight(zoom);
  },

  clientScrollLeft: function (left, zoom) {
    return Math.floor(left * _.clientSpaceWidth(zoom));
  },

  clientScrollTop: function (top, zoom) {
    return Math.floor(top * _.clientSpaceHeight(zoom));
  },

  clientCenteredScrollLeft: function (width, left, zoom) {
    return Math.floor(left * _.clientSpaceWidth(zoom) - width / 2);
  },

  clientCenteredScrollTop: function (height, top, zoom) {
    return Math.floor(top * _.clientSpaceHeight(zoom) - height / 2);
  },

  leftFromClientScrollLeft: function (scrollLeft, zoom) {
    return scrollLeft / _.clientSpaceWidth(zoom);
  },

  topFromClientScrollTop: function (scrollTop, zoom) {
    return scrollTop / _.clientSpaceHeight(zoom);
  },

  leftFromClientX: function (x, width, left, zoom) {
    return _.clamp(_.leftFromClientScrollLeft(_.clientCenteredScrollLeft(width, left, zoom) + x, zoom));
  },

  topFromClientY: function (y, height, top, zoom) {
    return _.clamp(_.topFromClientScrollTop(_.clientCenteredScrollTop(height, top, zoom) + y, zoom));
  },

  time: function (rawTime) {
    return (
      rawTime >= 0 ?
        Math.round((rawTime * 3600) % (24 * 3600)) / 3600 :
        24 - Math.round((-rawTime * 3600) % (24 * 3600)) / 3600);
  },
  
  zoomLevel: function (zoom) {
    return Math.pow(2, zoom);
  }
};
