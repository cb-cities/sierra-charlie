"use strict";

var BoundedSpiral = require("./lib/bounded-spiral");
var defs = require("./defs");
var iid = require("./image-id");
var tid = require("./tile-id");


module.exports = {
  componentDidMount: function () {
    this.rendererLocalSource = new BoundedSpiral(0, defs.tileXCount - 1, 0, defs.tileYCount - 1);
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

  renderRoadLinks: function (c, timeValue, zoomLevel, tileData) {
    c.strokeStyle = defs.roadLinkColor;
    // c.strokeStyle = "hsl(" + (timeValue / 24 * 360) + ", 100%, 50%)";
    for (var i = 0; i < tileData.roadLinks.length; i++) {
      var roadLink = tileData.roadLinks[i];
      var ps = roadLink.ps;
      c.beginPath();
      c.moveTo(ps[0].x, ps[0].y);
      for (var j = 0; j < ps.length; j++) {
        c.lineTo(ps[j].x, ps[j].y);
      }
      c.lineWidth = 4 * Math.sqrt(zoomLevel) * (defs.tileSize / defs.imageSize) * roadLink.travelTimes[timeValue];
      c.globalAlpha = 1;
      c.stroke();
    }
    c.globalAlpha = 1;
  },

  renderRoadNodes: function (c, timeValue, zoomLevel, tileData) {
    var nodeSize = 8 * Math.sqrt(zoomLevel) * (defs.tileSize / defs.imageSize);
    // c.fillStyle = defs.roadNodeColor;
    c.fillStyle = "hsl(" + (timeValue / 24 * 360) + ", 100%, 75%)";
    for (var i = 0; i < tileData.roadNodes.length; i++) {
      var p = tileData.roadNodes[i].p;
      c.fillRect(p.x - nodeSize / 2, p.y - nodeSize / 2, nodeSize, nodeSize);
    }
  },

  renderImage: function (imageId) {
    var tileId = iid.toTileId(imageId);
    var tileData = this.getLoadedTile(tileId);
    var timeValue  = iid.getTimeValue(imageId);
    var zoomPower  = iid.getZoomPower(imageId);
    var zoomLevel  = Math.pow(2, zoomPower);
    var groupCount = zoomLevel;
    var imageSize  = window.devicePixelRatio * defs.imageSize / zoomLevel;
    var groupSize  = imageSize * groupCount;
    var gx = Math.floor(iid.getLocalX(imageId) / groupCount) * groupCount;
    var gy = Math.floor(iid.getLocalY(imageId) / groupCount) * groupCount;
    var groupId = iid.fromLocal(gx, gy, timeValue, zoomPower);
    var canvas = this.getRenderedGroup(groupId);
    var c;
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.width  = groupSize;
      canvas.height = groupSize;
      c = canvas.getContext("2d");
      c.scale(imageSize / defs.tileSize, -imageSize / defs.tileSize);
      c.translate(-defs.localToTileX(gx) * defs.tileSize, -defs.localToTileY(gy - 1) * defs.tileSize);
      this.setRenderedGroup(groupId, canvas);
    } else {
      c = canvas.getContext("2d");
    }
    c.globalCompositeOperation = "screen";
    this.renderRoadLinks(c, timeValue, zoomLevel, tileData);
    // this.renderRoadNodes(c, timeValue, zoomLevel, tileData);
    c.globalCompositeOperation = "source-over";
    this.setRenderedImage(imageId, true);
  },

  getNextImageIdToRender: function () {
    while (true) {
      var local = this.rendererLocalSource.next();
      if (!local) {
        return null;
      }
      var tileId = tid.fromLocal(local.x, local.y);
      if (this.getLoadedTile(tileId)) {
        var imageId = iid.fromTileId(tileId, this.floorTimeValue, this.floorZoomPower);
        if (!(this.getRenderedImage(imageId))) {
          return imageId;
        }
      }
    }
  },

  renderNextImage: function () {
    var pendingImageId = this.getNextImageIdToRender();
    if (pendingImageId) {
      this.renderImage(pendingImageId);
      this.requestPainting();
      this.pendingRender = setTimeout(this.renderNextImage, 0);
    } else {
      this.pendingRender = null;
    }
  },

  requestRenderingImages: function () {
    this.rendererLocalSource.resetBounds(
      this.firstVisibleLocalX,
      this.lastVisibleLocalX,
      this.firstVisibleLocalY,
      this.lastVisibleLocalY,
      this.attentionLocalX,
      this.attentionLocalY);
    if (!this.pendingRender) {
      this.pendingRender = setTimeout(this.renderNextImage, 0);
    }
  }
};
