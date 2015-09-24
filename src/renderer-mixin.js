"use strict";

/* global Path2D */

var TileId = require("./tile-id");


var TILE_SIZE  = 1000;
var IMAGE_SIZE = 1024;


function computeZoomLevel(zoomPower) {
  return Math.pow(2, zoomPower);
}


module.exports = {
  componentDidMount: function () {
    this.renderedImages = {};
    this.renderQueue = [];
  },

  getImage: function (imageId) {
    return this.renderedImages[imageId];
  },

  setImage: function (imageId, imageData) {
    this.renderedImages[imageId] = imageData;
  },

  renderNextImage: function () {
    var pendingImageId;
    while (this.renderQueue.length) {
      var imageId = this.renderQueue.pop();
      if (!this.getImage(imageId) && this.isImageIdVisible(imageId)) {
        pendingImageId = imageId;
        break;
      }
    }
    if (pendingImageId) {
      var imageData = this.renderImage(pendingImageId);
      this.setImage(pendingImageId, imageData);
      this.paint();
      clearTimeout(this.pendingRender);
      this.pendingRender = setTimeout(this.renderNextImage, 0);
    }
  },

  prepareRoadLinks: function (roadLinks) {
    var path = new Path2D();
    for (var i = 0; i < (roadLinks || []).length; i++) {
      var ps = roadLinks[i].ps;
      path.moveTo(ps[0].x, ps[0].y);
      for (var j = 1; j < ps.length; j++) {
        path.lineTo(ps[j].x, ps[j].y);
      }
    }
    return path;
  },

  renderRoadLinks: function (c, zoomLevel, roadLinksPath) {
    c.lineWidth = 2 * Math.sqrt(zoomLevel) * (TILE_SIZE / IMAGE_SIZE);
    c.stroke(roadLinksPath);
  },

  renderRoadNodes: function (c, zoomLevel, roadNodes) {
    var rectSize = 4 * Math.sqrt(zoomLevel) * (TILE_SIZE / IMAGE_SIZE);
    for (var i = 0; i < roadNodes.length; i++) {
      var p = roadNodes[i].p;
      c.fillRect(p.x - rectSize, p.y - rectSize, rectSize * 2, rectSize * 2);
    }
  },

  renderImage: function (imageId) {
    var tileId = new TileId(imageId.tx, imageId.ty);
    var tileData = this.getTile(tileId);
    var zoomLevel = computeZoomLevel(imageId.tz);
    var imageSize = window.devicePixelRatio * IMAGE_SIZE / zoomLevel;
    var canvas = document.createElement("canvas");
    canvas.width  = imageSize;
    canvas.height = imageSize;
    var c = canvas.getContext("2d");
    c.scale(imageSize / TILE_SIZE, imageSize / TILE_SIZE);
    c.translate(-imageId.tx * TILE_SIZE, -imageId.ty * TILE_SIZE);
    c.strokeStyle = this.props.roadLinkColor;
    c.fillStyle = this.props.roadNodeColor;
    c.globalCompositeOperation = "screen";
    if (!tileData.roadLinksPath) {
      tileData.roadLinksPath = this.prepareRoadLinks(tileData.roadLinks);
    }
    this.renderRoadLinks(c, zoomLevel, tileData.roadLinksPath);
    this.renderRoadNodes(c, zoomLevel, tileData.roadNodes);
    return canvas;
  }
};
