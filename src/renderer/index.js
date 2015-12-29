"use strict";

var BoundedSpiral = require("../lib/bounded-spiral");
var defs = require("../defs");
var iid = require("../lib/image-id");
var tid = require("../lib/tile-id");


function _renderRoadLinks(c, time, zoom, tileData) {
  var zoomLevel = Math.pow(2, zoom);
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

function _renderRoadNodes(c, time, zoom, tileData) {
  var zoomLevel = Math.pow(2, zoom);
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
  this._floorTimeSignal = null;
  this._floorZoomSignal = null;
  this._pendingRender = null;
  this._renderedImages = {};
  this._renderedImageCount = [];
  this._renderedGroups = {};
}

Renderer.prototype = {

  _setRenderedImage: function (imageId, flag) {
    this._renderedImages[imageId] = flag;
    var time = iid.getTime(imageId);
    var zoom = iid.getZoom(imageId);
    this._incrementRenderedImageCount(time, zoom);
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

  _incrementRenderedImageCount: function (time, zoom) {
    var perTime = this._renderedImageCount[time];
    if (!perTime) {
      perTime = this._renderedImageCount[time] = [];
    }
    var perZoom = perTime[zoom];
    if (!perZoom) {
      perTime[zoom] = 1;
    } else {
      perTime[zoom]++;
    }
  },

  _getRenderedImageCount: function (time, zoom) {
    var perTime = this._renderedImageCount[time];
    if (!perTime) {
      return 0;
    } else {
      var perZoom = perTime[zoom];
      if (!perZoom) {
        return 0;
      } else {
        return perZoom;
      }
    }
  },

  _renderImage: function (imageId) {
    var tileId = iid.toTileId(imageId);
    var tileData = this._callbacks.getLoadedTile(tileId);
    var time  = iid.getTime(imageId);
    var zoom  = iid.getZoom(imageId);
    var zoomLevel  = Math.pow(2, zoom);
    var groupCount = zoomLevel;
    var imageSize  = window.devicePixelRatio * defs.imageSize / zoomLevel;
    var groupSize  = imageSize * groupCount;
    var gx = Math.floor(iid.getLocalX(imageId) / groupCount) * groupCount;
    var gy = Math.floor(iid.getLocalY(imageId) / groupCount) * groupCount;
    var groupId = iid.fromLocal(gx, gy, time, zoom);
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
    _renderRoadLinks(c, time, zoom, tileData);
    _renderRoadNodes(c, time, zoom, tileData);
    this._setRenderedImage(imageId, true);
  },

  _getNextImageIdToRender: function () {
    while (true) {
      var local = this._localSource.next();
      if (!local) {
        return null;
      }
      var tileId = tid.fromLocal(local.x, local.y);
      if (this._callbacks.getLoadedTile(tileId)) {
        var imageId = iid.fromTileId(tileId, this._floorTimeSignal, this._floorZoomSignal);
        if (!(this.getRenderedImage(imageId))) {
          return imageId;
        }
      }
    }
  },

  _renderNextImage: function () {
    var pendingImageId = this._getNextImageIdToRender();
    if (pendingImageId) {
      this._renderImage(pendingImageId);
      this._callbacks.onImageRender(pendingImageId);
      this._pendingRender = setTimeout(this._renderNextImage.bind(this), 0);
    } else {
      this._pendingRender = null;
    }
  },
  
  _isFinished: function () {
    return this._getRenderedImageCount(this._floorTimeSignal, this._floorZoomSignal) === defs.maxTileCount;
  },

  update: function (state) {
    this._floorTimeSignal = state.floorTimeSignal;
    this._floorZoomSignal = state.floorZoomSignal;
    if (!this._isFinished()) {
      this._localSource.resetBounds(
        state.firstVisibleLocalX,
        state.lastVisibleLocalX,
        state.firstVisibleLocalY,
        state.lastVisibleLocalY,
        state.localXSignal,
        state.localYSignal);
      if (!this._pendingRender) {
        this._pendingRender = setTimeout(this._renderNextImage.bind(this), 0);
      }
    }
  }
};

module.exports = Renderer;
