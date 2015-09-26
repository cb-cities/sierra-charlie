"use strict";

/* global Path2D */

var defs = require("./defs");
var iid = require("./image-id");
var tid = require("./tile-id");


module.exports = {
  componentDidMount: function () {
    this.collectedImageIds = [];
    this.queuedImageIds = [];
    this.renderedImages = {};
    this.renderedGroups = {};
  },

  componentWillUnmount: function () {
    clearTimeout(this.pendingRender);
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
    var tx = tileId.getTileX();
    var ty = tileId.getTileY();
    var floorImageId = new iid.ImageId(tx, ty, floorZoomPower);
    var ceilImageId  = new iid.ImageId(tx, ty, ceilZoomPower);
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
      var tx = imageId.getTileX();
      var ty = imageId.getTileY();
      var zoomPower = imageId.getZoomPower();
      if (!this.getRenderedImage(imageId) && this.isImageVisible(tx, ty, zoomPower)) {
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
    c.lineWidth = 2 * Math.sqrt(zoomLevel) * (defs.tileSize / defs.imageSize);
    c.stroke(tileData.roadLinksPath);
  },

  renderRoadNodes: function (c, zoomLevel, tileData) {
    var rectSize = 4 * Math.sqrt(zoomLevel) * (defs.tileSize / defs.imageSize);
    for (var i = 0; i < tileData.roadNodes.length; i++) {
      var p = tileData.roadNodes[i].p;
      c.fillRect(p.x - rectSize, p.y - rectSize, rectSize * 2, rectSize * 2);
    }
  },

  renderImage: function (imageId) {
    var tx = imageId.getTileX();
    var ty = imageId.getTileY();
    var tileId = new tid.TileId(tx, ty);
    var tileData = this.getLoadedTile(tileId);
    var zoomPower  = imageId.getZoomPower();
    var zoomLevel  = Math.pow(2, zoomPower);
    var groupCount = zoomLevel;
    var imageSize  = window.devicePixelRatio * defs.imageSize / zoomLevel;
    var groupSize  = imageSize * groupCount;
    var gtx = Math.floor(tx / groupCount) * groupCount;
    var gty = Math.floor(ty / groupCount) * groupCount;
    var groupId = new iid.ImageId(gtx, gty, zoomPower);
    var canvas = this.getRenderedGroup(groupId);
    var c;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width  = groupSize;
      canvas.height = groupSize;
      c = canvas.getContext("2d");
      c.strokeStyle = this.props.roadLinkColor;
      c.fillStyle   = this.props.roadNodeColor;
      c.scale(imageSize / defs.tileSize, imageSize / defs.tileSize);
      c.translate(-gtx * defs.tileSize, -gty * defs.tileSize);
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
