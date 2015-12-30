"use strict";

var BoundedSpiral = require("../lib/bounded-spiral");
var compute = require("../compute");
var defs = require("../defs");
var iid = require("../lib/image-id");
var tid = require("../lib/tile-id");


function _renderRoadLinks(c, time, zoom, tileData) {
  c.lineWidth = compute.roadLinkLineWidth(zoom);
  c.strokeStyle = "#fff";
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
  var nodeSize = compute.roadNodeSquareSize(zoom);
  c.fillStyle = "#fff";
  for (var i = 0; i < tileData.roadNodes.length; i++) {
    var p = tileData.roadNodes[i].p;
    c.fillRect(p.x - nodeSize / 2, p.y - nodeSize / 2, nodeSize, nodeSize);
  }
}


function Renderer(props) {
  this._props = props;
  this._localSource = new BoundedSpiral(0, 0, defs.tileXCount - 1, defs.tileYCount - 1);
  this._time = null;
  this._zoom = null;
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
    var tileId     = iid.toTileId(imageId);
    var tileData   = this._props.getLoadedTile(tileId);
    var time       = iid.getTime(imageId);
    var zoom       = iid.getZoom(imageId);
    var imageSize  = window.devicePixelRatio * compute.imageSize(zoom);
    var groupCount = compute.groupCount(zoom);
    var groupSize  = imageSize * groupCount;
    var gx         = Math.floor(iid.getLocalX(imageId) / groupCount) * groupCount;
    var gy         = Math.floor(iid.getLocalY(imageId) / groupCount) * groupCount;
    var groupId    = iid.fromLocal(gx, gy, time, zoom);
    var canvas     = this.getRenderedGroup(groupId);
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
      if (this._props.getLoadedTile(tileId)) {
        var imageId = iid.fromTileId(tileId, this._time, this._zoom);
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
      this._props.onImageRender(pendingImageId);
      this._pendingRender = setTimeout(this._renderNextImage.bind(this), 0);
    } else {
      this._pendingRender = null;
    }
  },
  
  _isFinished: function () {
    return this._getRenderedImageCount(this._time, this._zoom) === defs.maxTileCount;
  },

  update: function () {
    if (!this._props.useWebGL) {
      var state = this._props.getDerivedState();
      this._time = Math.floor(state.time);
      this._zoom = Math.round(state.zoom);
      if (!this._isFinished()) {
        this._localSource.resetBounds(
          compute.firstVisibleLocalX(state.width, state.left, state.zoom),
          compute.firstVisibleLocalY(state.height, state.top, state.zoom),
          compute.lastVisibleLocalX(state.width, state.left, state.zoom),
          compute.lastVisibleLocalY(state.height, state.top, state.zoom),
          compute.localX(state.left),
          compute.localY(state.top));
        if (!this._pendingRender) {
          this._pendingRender = setTimeout(this._renderNextImage.bind(this), 0);
        }
      }
    }
  }
};

module.exports = Renderer;
