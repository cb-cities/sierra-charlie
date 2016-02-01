"use strict";

const defs = require("./defs");
const rect = require("./lib/rect");


const _ = module.exports = {
  clamp: function (v, minV, maxV) {
    return Math.max(minV, Math.min(v, maxV));
  },

  clampX: function (x) {
    return _.clamp(x, defs.firstTileX, defs.lastTileX + defs.tileSize);
  },

  clampY: function (y) {
    return _.clamp(y, defs.firstTileY, defs.lastTileY + defs.tileSize);
  },

  clampPoint: function (p) {
    return [
      _.clampX(p[0]),
      _.clampY(p[1])
    ];
  },

  clampZoom: function (zoom) {
    return _.clamp(zoom, defs.minZoom, defs.maxZoom);
  },

  totalClientWidth: function (zoom) {
    return defs.tileCountX * defs.baseClientTileSize / _.zoomLevel(zoom);
  },

  totalClientHeight: function (zoom) {
    return defs.tileCountY * defs.baseClientTileSize / _.zoomLevel(zoom);
  },

  fromClientSize: function (clientSize, zoom) {
    return clientSize / defs.baseClientTileSize * (_.zoomLevel(zoom) * defs.tileSize);
  },

  scrollLeftFromCenterX: function (centerX, zoom) {
    return (
      (centerX - defs.firstTileX) / defs.totalWidth * _.totalClientWidth(zoom));
  },

  scrollTopFromCenterY: function (centerY, zoom) {
    return (
      (1 - (centerY - defs.firstTileY) / defs.totalHeight) * _.totalClientHeight(zoom));
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
    return [
      _.fromClientX(clientP[0], clientWidth, centerX, zoom),
      _.fromClientY(clientP[1], clientHeight, centerY, zoom)
    ];
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
      (x - centerX) * defs.baseClientTileSize / (_.zoomLevel(zoom) * defs.tileSize) + clientWidth / 2);
  },

  toClientY: function (y, clientHeight, centerY, zoom) {
    return (
      clientHeight - ((y - centerY) * defs.baseClientTileSize / (_.zoomLevel(zoom) * defs.tileSize) + clientHeight / 2));
  },

  toClientPoint: function (p, clientWidth, clientHeight, centerX, centerY, zoom) {
    return [
      _.toClientX(p[0], clientWidth, centerX, zoom),
      _.toClientY(p[1], clientHeight, centerY, zoom)
    ];
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
  },

  fromRGBA: function (r, g, b, a) {
    return r | (g << 8) | (b << 16) | (a << 24); // NOTE: Little-endian byte order
  },

  fromRGB: function (r, g, b) {
    return r | (g << 8) | (b << 16); // NOTE: Little-endian byte order
  }
};
