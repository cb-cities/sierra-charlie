"use strict";

/* global Path2D */

var ImageId = require("./image-id");
var TileId = require("./tile-id");


module.exports = {
  componentDidMount: function () {
    this.collectedImageIds = [];
    this.queuedImageIds = [];
    this.renderedImages = {};
    this.renderedGroups = {};
  },

  setRenderedImage: function (imageId, flag) {
    this.renderedImages[imageId] = flag;
  },

  getRenderedImage: function (imageId) {
    return this.renderedImages[imageId];
  },

  setRenderedGroup: function (groupId, canvas) {
    this.renderedGroups[groupId] = canvas;
  },

  getRenderedGroup: function (groupId) {
    return this.renderedGroups[groupId];
  },

  collectImagesToQueue: function (tileId, floorZoomPower, ceilZoomPower) {
    var floorImageId = new ImageId(tileId.tx, tileId.ty, floorZoomPower);
    var ceilImageId  = new ImageId(tileId.tx, tileId.ty, ceilZoomPower);
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
      this.renderImage(pendingImageId);
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
    var zoomPower  = imageId.tz;
    var roundPower = zoomPower;
    var zoomLevel  = Math.pow(2, zoomPower);
    var groupCount = Math.pow(2, roundPower);
    var imageSize  = window.devicePixelRatio * this.props.imageSize / zoomLevel;
    var groupSize  = imageSize * groupCount;
    var gtx = Math.floor(imageId.tx / groupCount) * groupCount;
    var gty = Math.floor(imageId.ty / groupCount) * groupCount;
    var groupId = new ImageId(gtx, gty, roundPower);
    var canvas = this.getRenderedGroup(groupId);
    var c;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width  = groupSize;
      canvas.height = groupSize;
      c = canvas.getContext("2d");
      c.strokeStyle = this.props.roadLinkColor;
      c.fillStyle   = this.props.roadNodeColor;
      c.scale(imageSize / this.props.tileSize, imageSize / this.props.tileSize);
      c.translate(-gtx * this.props.tileSize, -gty * this.props.tileSize);
      this.setRenderedGroup(groupId, canvas);
    } else {
      c = canvas.getContext("2d");
    }
    this.renderRoadLinks(c, zoomLevel, tileData);
    c.globalCompositeOperation = "screen";
    this.renderRoadNodes(c, zoomLevel, tileData);
    c.globalCompositeOperation = "source-over";
    this.setRenderedImage(imageId, true);
  }
};
