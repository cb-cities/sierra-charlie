"use strict";

var defs = require("./defs");


var _ = module.exports = {
  clamp: function (value) {
    return (Math.max(0, Math.min(value, 1)));
  },

  clampX: function (x) {
    return (
      Math.max(defs.firstTileX,
        Math.min(x, defs.lastTileX + defs.tileSize)));
  },

  clampY: function (y) {
    return (
      Math.max(defs.firstTileY,
        Math.min(y, defs.lastTileY + defs.tileSize)));
  },

  clampZoom: function (zoom) {
    return (
      Math.max(0,
        Math.min(zoom, defs.maxZoom)));
  },

  totalClientWidth: function (zoom) {
    return defs.tileCountX * defs.baseClientTileSize / _.zoomLevel(zoom);
  },

  totalClientHeight: function (zoom) {
    return defs.tileCountY * defs.baseClientTileSize / _.zoomLevel(zoom);
  },

  visibleWidth: function (clientWidth, zoom) {
    return clientWidth / _.totalClientWidth(zoom) * defs.totalWidth;
  },

  visibleHeight: function (clientHeight, zoom) {
    return clientHeight / _.totalClientHeight(zoom) * defs.totalHeight;
  },

  scrollLeft: function (centerX, zoom) {
    return (
      Math.floor(
        (centerX - defs.firstTileX) / defs.totalWidth * _.totalClientWidth(zoom)));
  },

  scrollTop: function (centerY, zoom) {
    return (
      Math.floor(
        (1 - (centerY - defs.firstTileY) / defs.totalHeight) * _.totalClientHeight(zoom)));
  },

  centerXFromScrollLeft: function (scrollLeft, zoom) {
    return scrollLeft / _.totalClientWidth(zoom) * defs.totalWidth + defs.firstTileX;
  },

  centerYFromScrollTop: function (scrollTop, zoom) {
    return (1 - scrollTop / _.totalClientHeight(zoom)) * defs.totalHeight + defs.firstTileY;
  },

  fromClientX: function (clientX, clientWidth, centerX, zoom) {
    return _.centerXFromScrollLeft(_.scrollLeft(centerX, zoom) + clientX - clientWidth / 2, zoom);
  },

  fromClientY: function (clientY, clientHeight, centerY, zoom) {
    return _.centerYFromScrollTop(_.scrollTop(centerY, zoom) + clientY - clientHeight / 2, zoom);
  },

  fromClientPoint: function (clientP, clientWidth, clientHeight, centerX, centerY, zoom) {
    return {
      x: _.fromClientX(clientP.x, clientWidth, centerX, zoom),
      y: _.fromClientY(clientP.y, clientHeight, centerY, zoom)
    };
  },

  fromClientRect: function (clientR, clientWidth, clientHeight, centerX, centerY, zoom) {
    return {
      left: _.fromClientX(clientR.left, clientWidth, centerX, zoom),
      top: _.fromClientY(clientR.bottom, clientHeight, centerY, zoom),
      right: _.fromClientX(clientR.right, clientWidth, centerX, zoom),
      bottom: _.fromClientY(clientR.top, clientHeight, centerY, zoom)
    };
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
