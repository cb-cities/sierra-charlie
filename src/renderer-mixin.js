"use strict";

/* global Path2D */

var ImageId = require("./image-id");
var TileId = require("./tile-id");


module.exports = {
  componentDidMount: function () {
    this.collectedImageIds = [];
    this.queuedImageIds = [];
    this.renderedImages = {};
  },

  setRenderedImage: function (imageId, imageData) {
    this.renderedImages[imageId] = imageData;
  },

  getRenderedImage: function (imageId) {
    return this.renderedImages[imageId];
  },

  collectImagesToQueue: function (tileId) {
    var zoomPower = this.getEasedZoomPower();
    var floorImageId = new ImageId(tileId.tx, tileId.ty, Math.floor(zoomPower));
    var ceilImageId  = new ImageId(tileId.tx, tileId.ty, Math.ceil(zoomPower));
    if (!this.getRenderedImage(floorImageId)) {
      this.collectedImageIds.push(floorImageId);
    }
    if (ceilImageId !== floorImageId && !this.getRenderedImage(ceilImageId)) {
      this.collectedImageIds.push(ceilImageId);
    }
  },

  queueImagesToRender: function () {
    var imageIds = this.collectedImageIds.reverse();
    this.collectedImageIds = [];
    if (imageIds.length) {
      this.queuedImageIds = this.queuedImageIds.concat(imageIds);
      return true;
    }
    return false;
  },

  renderNextImage: function () {
    var pendingImageId;
    while (this.queuedImageIds.length) {
      var imageId = this.queuedImageIds.pop();
      if (!this.getRenderedImage(imageId) && this.isImageVisible(imageId.tx, imageId.ty, imageId.tz)) {
        pendingImageId = imageId;
        break;
      }
    }
    if (pendingImageId) {
      var imageData = this.renderImage(pendingImageId);
      this.setRenderedImage(pendingImageId, imageData);
      this.paint();
      clearTimeout(this.pendingRender);
      this.pendingRender = setTimeout(this.renderNextImage, 0);
    }
  },

  renderRoadLinks: function (c, zoomLevel, tileData) {
    if (!tileData.roadLinksPath) {
      var path = new Path2D();
      for (var i = 0; i < tileData.roadLinks.length; i++) {
        var ps = tileData.roadLinks[i].ps;
        path.moveTo(ps[0].x, ps[0].y);
        for (var j = 1; j < ps.length; j++) {
          path.lineTo(ps[j].x, ps[j].y);
        }
      }
      tileData.roadLinksPath = path;
    }
    c.lineWidth = 2 * Math.sqrt(zoomLevel) * (this.props.tileSize / this.props.imageSize);
    c.stroke(tileData.roadLinksPath);
  },

  renderRoadNodes: function (c, zoomLevel, tileData) {
    var rectSize = 4 * Math.sqrt(zoomLevel) * (this.props.tileSize / this.props.imageSize);
    for (var i = 0; i < tileData.roadNodes.length; i++) {
      var p = tileData.roadNodes[i].p;
      c.fillRect(p.x - rectSize, p.y - rectSize, rectSize * 2, rectSize * 2);
    }
  },

  renderImage: function (imageId) {
    var tileId = new TileId(imageId.tx, imageId.ty);
    var tileData = this.getLoadedTile(tileId);
    var zoomLevel = Math.pow(2, imageId.tz);
    var imageSize = window.devicePixelRatio * this.props.imageSize / zoomLevel;
    var canvas = document.createElement("canvas");
    canvas.width  = imageSize;
    canvas.height = imageSize;
    var c = canvas.getContext("2d");
    c.fillStyle = this.props.backgroundColor;
    c.fillRect(0, 0, imageSize, imageSize);
    c.scale(imageSize / this.props.tileSize, imageSize / this.props.tileSize);
    c.translate(-imageId.tx * this.props.tileSize, -imageId.ty * this.props.tileSize);
    c.strokeStyle = this.props.roadLinkColor;
    c.fillStyle = this.props.roadNodeColor;
    c.globalCompositeOperation = "screen";
    this.renderRoadLinks(c, zoomLevel, tileData);
    this.renderRoadNodes(c, zoomLevel, tileData);
    return canvas;
  }
};
