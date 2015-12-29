"use strict";

var BoundedSpiral = require("../lib/bounded-spiral");
var defs = require("../defs");
var iid = require("../lib/image-id");
var tid = require("../lib/tile-id");


function _renderRoadLinks(c, timeValue, zoomLevel, tileData) {
  c.lineWidth = 4 * Math.sqrt(zoomLevel) * (defs.tileSize / defs.imageSize);
  c.strokeStyle = "#666";
  for (var i = 0; i < tileData.roadLinks.length; i++) {
    var roadLink = tileData.roadLinks[i];
    var ps = roadLink.ps;
    c.beginPath();
    c.moveTo(ps[0].x, ps[0].y);
    for (var j = 0; j < ps.length; j++) {
      c.lineTo(ps[j].x, ps[j].y);
    }
    c.stroke();
  }
}

function _renderRoadNodes(c, timeValue, zoomLevel, tileData) {
  var nodeSize = 8 * Math.sqrt(zoomLevel) * (defs.tileSize / defs.imageSize);
  c.lineWidth = 2 * Math.sqrt(zoomLevel) * (defs.tileSize / defs.imageSize);
  c.strokeStyle = "#999";
  for (var i = 0; i < tileData.roadNodes.length; i++) {
    var p = tileData.roadNodes[i].p;
    c.strokeRect(p.x - nodeSize / 2, p.y - nodeSize / 2, nodeSize, nodeSize);
  }
}


function Renderer(callbacks) {
  this._callbacks = callbacks;
  this._localSource = new BoundedSpiral(0, defs.tileXCount - 1, 0, defs.tileYCount - 1);
  this._pendingRender = null;
  this._renderedImages = {};
  this._renderedImageCount = [];
  this._renderedGroups = {};
}

Renderer.prototype = {

  _setRenderedImage: function (imageId, flag) {
    this._renderedImages[imageId] = flag;
    var timeValue = iid.getTimeValue(imageId);
    var zoomPower = iid.getZoomPower(imageId);
    this._incrementRenderedImageCount(timeValue, zoomPower);
  },

  getRenderedImage: function (imageId) {
    return this._renderedImages[imageId];
  },

  _setRenderedGroup: function (groupId, canvas) {
    this._renderedGroups[groupId] = canvas;
  },

  getRenderedGroup: function (groupId) {
    return this._renderedGroups[groupId];
  },

  _incrementRenderedImageCount: function (timeValue, zoomPower) {
    var perTimeValue = this._renderedImageCount[timeValue];
    if (!perTimeValue) {
      perTimeValue = this._renderedImageCount[timeValue] = [];
    }
    var perZoomPower = perTimeValue[zoomPower];
    if (!perZoomPower) {
      perTimeValue[zoomPower] = 1;
    } else {
      perTimeValue[zoomPower]++;
    }
  },

  _getRenderedImageCount: function (timeValue, zoomPower) {
    var perTimeValue = this._renderedImageCount[timeValue];
    if (!perTimeValue) {
      return 0;
    } else {
      var perZoomPower = perTimeValue[zoomPower];
      if (!perZoomPower) {
        return 0;
      } else {
        return perZoomPower;
      }
    }
  },

  _renderImage: function (imageId) {
    var tileId = iid.toTileId(imageId);
    var tileData = this._callbacks.getLoadedTile(tileId);
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
      this._setRenderedGroup(groupId, canvas);
    } else {
      c = canvas.getContext("2d");
    }
    _renderRoadLinks(c, timeValue, zoomLevel, tileData);
    _renderRoadNodes(c, timeValue, zoomLevel, tileData);
    this._setRenderedImage(imageId, true);
  },

  _getNextImageIdToRender: function (timeValue, zoomPower) {
    while (true) {
      var local = this._localSource.next();
      if (!local) {
        return null;
      }
      var tileId = tid.fromLocal(local.x, local.y);
      if (this._callbacks.getLoadedTile(tileId)) {
        var imageId = iid.fromTileId(tileId, timeValue, zoomPower);
        if (!(this.getRenderedImage(imageId))) {
          return imageId;
        }
      }
    }
  },

  _renderNextImage: function (timeValue, zoomPower) {
    var pendingImageId = this._getNextImageIdToRender(timeValue, zoomPower);
    if (pendingImageId) {
      this._renderImage(pendingImageId);
      this._callbacks.onImageRender(pendingImageId);
      this._pendingRender = setTimeout(function () {
          this._renderNextImage(timeValue, zoomPower);
        }.bind(this), 0);
    } else {
      this._pendingRender = null;
    }
  },
  
  _isFinished: function (timeValue, zoomPower) {
    return this._getRenderedImageCount(timeValue, zoomPower) === defs.maxTileCount;
  },

  update: function (state) {
    var timeValue = state.floorTimeValue;
    var zoomPower = state.floorZoomPower;
    if (!this._isFinished(timeValue, zoomPower)) {
      if (state.renderNotVisibleImages) {
        this._localSource.resetBounds(
          0,
          defs.tileXCount - 1,
          0,
          defs.tileYCount - 1,
          state.attentionLocalX,
          state.attentionLocalY);
      } else {
        this._localSource.resetBounds(
          state.firstVisibleLocalX,
          state.lastVisibleLocalX,
          state.firstVisibleLocalY,
          state.lastVisibleLocalY,
          state.attentionLocalX,
          state.attentionLocalY);
      }
      if (!this._pendingRender) {
        this._pendingRender = setTimeout(function () {
            this._renderNextImage(timeValue, zoomPower);
          }.bind(this), 0);
      }
    }
  }
};

module.exports = Renderer;
