"use strict";

var r = require("react-wrapper");
var tweenState = require("react-tween-state");
var Loader = require("worker?inline!./loader");
var MISSING_TILE_IDS = require("./missing-tile-ids.js");

var TILE_SIZE    = 1000;
var IMAGE_SIZE   = 1024;
var FIRST_TILE_X = 490;
var LAST_TILE_X  = 572;
var FIRST_TILE_Y = 148;
var LAST_TILE_Y  = 208;
var TILE_X_COUNT = LAST_TILE_X - FIRST_TILE_X + 1;
var TILE_Y_COUNT = LAST_TILE_Y - FIRST_TILE_Y + 1;
// var INITIAL_TILE_X = 530;
// var INITIAL_TILE_Y = 180;

// function tileToLocalX(tx) {
//   return tx - FIRST_TILE_X;
// }
//
// function tileToLocalTileY(ty) {
//   return LAST_TILE_Y - ty;
// }

function localToTileX(lx) {
  return FIRST_TILE_X + lx;
}

function localToTileY(ly) {
  return LAST_TILE_Y - ly;
}

function pointToLocalX(px, zoomRatio) {
  return (
    Math.min(
      Math.floor(px / (IMAGE_SIZE * zoomRatio)),
      TILE_X_COUNT - 1));
}

function pointToLocalY(py, zoomRatio) {
  return (
    Math.min(
      Math.floor(py / (IMAGE_SIZE * zoomRatio)),
      TILE_Y_COUNT - 1));
}

function computeZoomBase(zoomLevel) {
  if (zoomLevel <=   1 +   2/2) { return   1; }
  if (zoomLevel <=   2 +   4/2) { return   2; }
  if (zoomLevel <=   4 +   8/2) { return   4; }
  if (zoomLevel <=   8 +  16/2) { return   8; }
  if (zoomLevel <=  16 +  32/2) { return  16; }
  if (zoomLevel <=  32 +  64/2) { return  32; }
  if (zoomLevel <=  64 + 128/2) { return  64; }
  if (zoomLevel <= 128 + 256/2) { return 128; }
  return 256;
}

module.exports = {
  mixins: [tweenState.Mixin],

  getInitialState: function () {
    return {
      zoomLevel: 8
    };
  },

  componentDidMount: function () {
    this.node         = r.domNode(this);
    this.canvas       = this.node.firstChild;
    this.scrollLeft   = this.node.scrollLeft;
    this.scrollTop    = this.node.scrollTop;
    this.clientWidth  = this.node.clientWidth;
    this.clientHeight = this.node.clientHeight;
    this.node.addEventListener("scroll", this.onScroll);
    addEventListener("resize", this.onResize);
    addEventListener("keydown", this.onKeyDown);
    this.tileData   = {};
    this.imageData  = {};
    this.imageQueue = [];
    this.startLoader();
    this.computeVisibleTiles();
    this.forceQueueAllTiles();
    this.loadVisibleTiles();
    this.paint();
  },

  componentWillUnmount: function () {
    this.node.removeEventListener("scroll", this.onScroll);
    removeEventListener("resize", this.onResize);
    removeEventListener("keydown", this.onKeyDown);
    this.stopLoader();
  },

  componentDidUpdate: function () {
    this.computeVisibleTiles();
    this.loadVisibleTiles();
    this.paint();
  },

  onScroll: function (event) {
    this.scrollLeft = this.node.scrollLeft;
    this.scrollTop  = this.node.scrollTop;
    this.computeVisibleTiles();
    this.loadVisibleTiles();
    this.paint();
  },

  onResize: function (event) {
    this.clientWidth  = this.node.clientWidth;
    this.clientHeight = this.node.clientHeight;
    this.computeVisibleTiles();
    this.loadVisibleTiles();
    this.paint();
  },





  computeVisibleTiles: function () {
    var zoomRatio = 1 / this.getTweeningValue("zoomLevel");
    this.fvlx = pointToLocalX(this.scrollLeft, zoomRatio);
    this.lvlx = pointToLocalX(this.scrollLeft + this.clientWidth - 1, zoomRatio);
    this.fvly = pointToLocalY(this.scrollTop, zoomRatio);
    this.lvly = pointToLocalY(this.scrollTop + this.clientHeight - 1, zoomRatio);
    this.fvtx = localToTileX(this.fvlx);
    this.lvtx = localToTileX(this.lvlx);
    this.fvty = localToTileY(this.fvly);
    this.lvty = localToTileY(this.lvly);
  },

  isTileVisible: function (tileId) {
    var txy = tileId.split("-");
    var tx = parseInt(txy[0]);
    var ty = parseInt(txy[1]);
    return this.isTileVisibleSplit(tx, ty);
  },

  isTileVisibleSplit: function (tx, ty) {
    return (
      tx >= this.fvtx &&
      tx <= this.lvtx &&
      ty <= this.fvty &&
      ty >= this.lvty);
  },

  isImageVisible: function (imageId) {
    var txyz = imageId.split("-");
    var tx = parseInt(txyz[0]);
    var ty = parseInt(txyz[1]);
    var zoomLevel = parseInt(txyz[2]);
    return this.isImageVisibleSplit(tx, ty, zoomLevel);
  },

  isImageVisibleSplit: function (tx, ty, zoomLevel) {
    var zoomBase = computeZoomBase(this.getTweeningValue("zoomLevel"));
    return (
      zoomLevel === zoomBase &&
      this.isTileVisibleSplit(tx, ty));
  },





  startLoader: function () {
    this.loader = new Loader();
    this.loader.addEventListener("message", this.onMessage);
    this.loader.postMessage({
        message: "setOrigin",
        origin:  location.origin
      });
  },

  stopLoader: function () {
    this.loader.terminate();
    this.loader.removeEventListener("message", this.onMessage);
  },

  onMessage: function (event) {
    switch (event.data.message) {
      case "tileDidLoad":
        this.tileDidLoad(event.data.tileId, event.data.tileData);
        break;
    }
  },

  forceQueueAllTiles: function () {
    this.loader.postMessage({
        message: "forceQueueAllTiles",
        ftx: FIRST_TILE_X,
        ltx: LAST_TILE_X,
        fty: FIRST_TILE_Y,
        lty: LAST_TILE_Y
      });
  },

  loadVisibleTiles: function () {
    clearTimeout(this.pendingLoad);
    this.pendingLoad = setTimeout(this.loadVisibleTilesNow, 0);
  },

  loadVisibleTilesNow: function () {
    var zoomBase = computeZoomBase(this.getTweeningValue("zoomLevel"));
    var tileIds = [];
    for (var ty = this.lvty; ty <= this.fvty; ty++) {
      for (var tx = this.lvtx; tx >= this.fvtx; tx--) {
        var tileId = tx + "-" + ty;
        if (!(tileId in MISSING_TILE_IDS)) {
          if (!(tileId in this.tileData)) {
            tileIds.push(tileId);
          } else {
            var imageId = tileId + "-" + zoomBase;
            if (!(imageId in this.imageData)) {
              this.imageQueue.push(imageId);
            }
          }
        }
      }
    }
    this.loader.postMessage({
        message: "loadTiles",
        tileIds: tileIds
      });
    this.renderNextImage();
  },

  tileDidLoad: function (tileId, tileData) {
    this.tileData[tileId] = tileData;
    if (this.isTileVisible(tileId)) {
      var zoomBase = computeZoomBase(this.getTweeningValue("zoomLevel"));
      var imageId = tileId + "-" + zoomBase;
      this.imageQueue.push(imageId);
      this.renderNextImage();
    }
  },



  renderNextImage: function () {
    var pendingImageId;
    while (this.imageQueue.length) {
      var imageId = this.imageQueue.pop();
      if (!(imageId in this.imageData) && this.isImageVisible(imageId)) {
        pendingImageId = imageId;
        break;
      }
    }
    if (pendingImageId) {
      var imageData = this.renderImage(pendingImageId);
      this.imageData[pendingImageId] = imageData;
      this.paint();
      clearTimeout(this.pendingRender);
      this.pendingRender = setTimeout(this.renderNextImage, 0);
    }
  },

  renderRoadLinks: function (c, zoomLevel, roadLinks) {
    c.lineWidth = 2 * Math.sqrt(zoomLevel) * (TILE_SIZE / IMAGE_SIZE);
    for (var i = 0; i < roadLinks.length; i++) {
      var ps = roadLinks[i].ps;
      c.beginPath();
      c.moveTo(ps[0].x, ps[0].y);
      for (var j = 1; j < ps.length; j++) {
        c.lineTo(ps[j].x, ps[j].y);
      }
      c.stroke();
    }
  },

  renderRoadNodes: function (c, zoomLevel, roadNodes) {
    var rectSize = 4 * Math.sqrt(zoomLevel) * (TILE_SIZE / IMAGE_SIZE);
    for (var i = 0; i < roadNodes.length; i++) {
      var p = roadNodes[i].p;
      c.fillRect(p.x - rectSize, p.y - rectSize, rectSize * 2, rectSize * 2);
    }
  },

  renderImage: function (imageId) {
    var txyz = imageId.split("-");
    var tx = parseInt(txyz[0]);
    var ty = parseInt(txyz[1]);
    var tileId = tx + "-" + ty;
    var tileData = this.tileData[tileId];
    var zoomLevel = parseInt(txyz[2]);
    var zoomRatio = 1 / zoomLevel;
    var imageSize = IMAGE_SIZE * zoomRatio * window.devicePixelRatio;
    var canvas = document.createElement("canvas");
    canvas.width  = imageSize;
    canvas.height = imageSize;
    var c = canvas.getContext("2d");
    c.scale(imageSize / TILE_SIZE, imageSize / TILE_SIZE);
    c.translate(-tx * TILE_SIZE, -ty * TILE_SIZE);
    c.fillStyle   = "#f93";
    c.strokeStyle = "#f63";
    c.font         = 18 * Math.sqrt(zoomLevel) + 'px "HelveticaNeue-UltraLight", Helvetica, Arial, sans-serif';
    c.textAlign    = "left";
    c.textBaseline = "top";
    c.globalCompositeOperation = "screen";
    this.renderRoadLinks(c, zoomLevel, tileData.roadLinks);
    this.renderRoadNodes(c, zoomLevel, tileData.roadNodes);
    return canvas;
  },


  paint: function () {
    if (!this.pendingPaint) {
      this.pendingPaint = true;
      window.requestAnimationFrame(this.paintNow);
    }
  },

  paintNow: function () {
    var width  = this.clientWidth * window.devicePixelRatio;
    var height = this.clientHeight * window.devicePixelRatio;
    var canvas = this.canvas;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
    }
    var c = canvas.getContext("2d", {alpha: false});
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.scale(window.devicePixelRatio, window.devicePixelRatio);
    c.fillStyle   = "#000";
    c.strokeStyle = "#0f0";
    c.fillRect(0, 0, this.clientWidth, this.clientHeight);
    this.paintTileBorders(c);
    this.paintTileContents(c);
    this.pendingPaint = false;
  },

  paintTileBorders: function (c) {
    var zoomLevel = this.getTweeningValue("zoomLevel");
    var zoomRatio = 1 / zoomLevel;
    c.save();
    c.translate(-this.scrollLeft + 0.25, -this.scrollTop + 0.25);
    c.scale(zoomRatio, zoomRatio);
    c.lineWidth   = 0.5 * zoomLevel;
    c.fillStyle   = "#333";
    c.strokeStyle = "#333";
    c.font        = 24 * Math.sqrt(zoomLevel) + 'px "HelveticaNeue-UltraLight", Helvetica, Arial, sans-serif';
    c.textAlign   = "left";
    c.textBaseline = "top";
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
        var tx = localToTileX(lx);
        var ty = localToTileY(ly);
        if (zoomLevel < 8) {
          c.fillText(tx + "×" + ty, lx * IMAGE_SIZE + 4 * Math.sqrt(zoomLevel), ly * IMAGE_SIZE);
        }
        c.strokeRect(lx * IMAGE_SIZE, ly * IMAGE_SIZE, IMAGE_SIZE, IMAGE_SIZE);
      }
    }
    c.restore();
  },

  getImage: function (tx, ty, zoomBase) {
    while (zoomBase >= 1) {
      var imageId = tx + "-" + ty + "-" + zoomBase;
      if (imageId in this.imageData) {
        return this.imageData[imageId];
      }
      zoomBase = Math.floor(zoomBase / 2);
    }
    return null;
  },

  paintTileContents: function (c) {
    var zoomLevel = this.getTweeningValue("zoomLevel");
    var zoomRatio = 1 / zoomLevel;
    var zoomBase = computeZoomBase(zoomLevel);
    c.translate(-this.scrollLeft, -this.scrollTop);
    c.scale(zoomRatio, -zoomRatio);
    c.translate(0, -TILE_Y_COUNT * IMAGE_SIZE);
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
        var tx = localToTileX(lx);
        var ty = localToTileY(ly);
        var imageData = this.getImage(tx, ty, zoomBase);
        if (imageData) {
          c.drawImage(imageData, lx * IMAGE_SIZE, (TILE_Y_COUNT - ly - 1) * IMAGE_SIZE, IMAGE_SIZE, IMAGE_SIZE);
        }
      }
    }
  },


  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    if (event.keyCode >= 49 && event.keyCode <= 58) {
      this.tweenState("zoomLevel", {
          duration: 1000,
          endValue: 1 << (event.keyCode - 49)
        });
    } else if (event.keyCode === 187) {
      this.tweenState("zoomLevel", {
          duration: 1000,
          endValue: Math.max(0, this.state.zoomLevel - 0.5),
          onEnd: function () {
            console.log("zoomLevel", this.state.zoomLevel);
          }.bind(this)
        });
    } else if (event.keyCode === 189) {
      this.tweenState("zoomLevel", {
          duration: 1000,
          endValue: Math.min(this.state.zoomLevel + 0.5, 256),
          onEnd: function () {
            console.log("zoomLevel", this.state.zoomLevel);
          }.bind(this)
        });
    }
  },

  onClick: function (event) {
    // console.log("click", event.clientX, event.clientY);
  },

  render: function () {
    var zoomRatio = 1 / this.getTweeningValue("zoomLevel");
    return (
      r.div("map-frame",
        r.canvas("map-picture"),
        r.div({
            className: "map-space",
            style: {
              width: TILE_X_COUNT * IMAGE_SIZE * zoomRatio,
              height: TILE_Y_COUNT * IMAGE_SIZE * zoomRatio
            },
            onClick: this.onClick
          })));
  }
};

r.makeComponent("App", module);
