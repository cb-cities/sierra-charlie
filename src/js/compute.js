"use strict";

var defs = require("./defs");
var rect = require("./rect");


var _ = module.exports = {
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

  clampPoint: function (p) {
    return {
      x: _.clampX(p.x),
      y: _.clampY(p.y)
    };
  },

  clampZoom: function (zoom) {
    return (
      Math.max(defs.minZoom,
        Math.min(zoom, defs.maxZoom)));
  },

  totalClientWidth: function (zoom) {
    return defs.tileCountX * defs.baseClientTileSize / _.zoomLevel(zoom);
  },

  totalClientHeight: function (zoom) {
    return defs.tileCountY * defs.baseClientTileSize / _.zoomLevel(zoom);
  },

  fromClientWidth: function (clientWidth, zoom) {
    return clientWidth / _.totalClientWidth(zoom) * defs.totalWidth;
  },

  fromClientHeight: function (clientHeight, zoom) {
    return clientHeight / _.totalClientHeight(zoom) * defs.totalHeight;
  },

  scrollLeftFromCenterX: function (centerX, zoom) {
    return (
      Math.floor(
        (centerX - defs.firstTileX) / defs.totalWidth * _.totalClientWidth(zoom)));
  },

  scrollTopFromCenterY: function (centerY, zoom) {
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
    return _.centerXFromScrollLeft(_.scrollLeftFromCenterX(centerX, zoom) + clientX - clientWidth / 2, zoom);
  },

  fromClientY: function (clientY, clientHeight, centerY, zoom) {
    return _.centerYFromScrollTop(_.scrollTopFromCenterY(centerY, zoom) + clientY - clientHeight / 2, zoom);
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

  toClientX: function (x, clientWidth, centerX, zoom) {
    return (
      Math.floor(
        (x - centerX) * defs.baseClientTileSize / (_.zoomLevel(zoom) * defs.tileSize) + clientWidth / 2));
  },

  toClientY: function (y, clientHeight, centerY, zoom) {
    return (
      Math.floor(
        clientHeight - ((y - centerY) * defs.baseClientTileSize / (_.zoomLevel(zoom) * defs.tileSize) + clientHeight / 2)));
  },

  toClientPoint: function (p, clientWidth, clientHeight, centerX, centerY, zoom) {
    return {
      x: _.toClientX(p.x, clientWidth, centerX, zoom),
      y: _.toClientY(p.y, clientHeight, centerY, zoom)
    };
  },

  toClientRect: function (r, clientWidth, clientHeight, centerX, centerY, zoom) {
    return {
      left: _.toClientX(r.left, clientWidth, centerX, zoom),
      top: _.toClientY(r.bottom, clientHeight, centerY, zoom),
      right: _.toClientY(r.right, clientWidth, centerX, zoom),
      bottom: _.toClientY(r.top, clientHeight, centerY, zoom)
    };
  },

  time: function (rawTime) {
    return (
      rawTime >= 0 ?
        Math.round((rawTime * 3600) % (24 * 3600)) / 3600 :
        24 - Math.round((-rawTime * 3600) % (24 * 3600)) / 3600);
  },

  zoomLevel: function (zoom) {
    return Math.pow(2, zoom - 2);
  },

  zoomForRect: function (r, clientWidth, clientHeight) {
    return (
      Math.max(
        Math.ceil(Math.log2(Math.ceil(rect.width(r) / _.zoomLevel(defs.minZoom) / clientWidth))),
        Math.ceil(Math.log2(Math.ceil(rect.height(r) / _.zoomLevel(defs.minZoom) / clientHeight)))));
  }
};
