"use strict";

var r = require("react-wrapper");
var easeTween = require("ease-tween");
var tweenState = require("react-tween-state");
var Loader = require("worker?inline!./loader");
var MISSING_TILE_IDS = require("./missing-tile-ids");
var spiral = require("./spiral");

var TILE_SIZE    = 1000;
var IMAGE_SIZE   = 1024;
var FIRST_TILE_X = 490;
var LAST_TILE_X  = 572;
var FIRST_TILE_Y = 148;
var LAST_TILE_Y  = 208;
var TILE_X_COUNT = LAST_TILE_X - FIRST_TILE_X + 1;
var TILE_Y_COUNT = LAST_TILE_Y - FIRST_TILE_Y + 1;

var MAX_ZOOM_POWER = 8;

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

function computeZoomLevel(zoomPower) {
  return Math.pow(2, zoomPower);
}

function clampLocalX(lx) {
  return Math.max(0, Math.min(lx, TILE_X_COUNT - 1));
}

function clampLocalY(ly) {
  return Math.max(0, Math.min(ly, TILE_Y_COUNT - 1));
}


module.exports = {
  mixins: [tweenState.Mixin],

  getInitialState: function () {
    return {
      zoomPower: 3
    };
  },

  getDefaultProps: function () {
    return {
      backgroundColor: "#000",
      inverseBackgroundColor: "#fff",
      roadLinkColor: "#f63",
      roadNodeColor: "#f93",
      borderColor: "#333",
      borderFont: '"HelveticaNeue-UltraLight", Helvetica, Arial, sans-serif'
    };
  },

  getZoomPower: function () {
    return this.getTweeningValue("zoomPower");
  },

  getZoomLevel: function () {
    return computeZoomLevel(this.getZoomPower());
  },

  tweenZoomPower: function (zoomPower, duration) {
    this.pendingZoom = this.pendingZoom || 0;
    this.pendingZoom++;
    this.tweenState("zoomPower", {
        endValue: zoomPower,
        duration: duration,
        easing: function (elapsed, from, to, duration) {
          return from + (to - from) * easeTween.ease(elapsed / duration);
        },
        onEnd: function () {
          this.pendingZoom--;
        }.bind(this)
      });
  },

  componentDidMount: function () {
    this.exportBackgroundColor();
    this.node = r.domNode(this);
    this.canvas = this.node.firstChild;
    this.clientWidth  = this.node.clientWidth;
    this.clientHeight = this.node.clientHeight;
    this.attentionLeft = 0.4897637424698795;
    this.attentionTop  = 0.4768826844262295;
    this.exportScrollPosition();
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

  componentDidUpdate: function (prevProps, prevState) {
    if (prevState.invertColor !== this.state.invertColor) {
      this.exportBackgroundColor();
    }
    this.exportScrollPosition();
    this.computeVisibleTiles();
    this.loadVisibleTiles();
    this.paint();
  },

  onScroll: function (event) {
    if (!this.pendingZoom) {
      this.importScrollPosition();
      this.computeVisibleTiles();
      this.loadVisibleTiles();
      this.paint();
    }
  },

  onResize: function (event) {
    this.clientWidth  = this.node.clientWidth;
    this.clientHeight = this.node.clientHeight;
    this.computeVisibleTiles();
    this.loadVisibleTiles();
    this.paint();
  },

  exportBackgroundColor: function () {
    document.body.style.backgroundColor = (
      !this.state.invertColor ?
        this.props.backgroundColor :
        this.props.inverseBackgroundColor);
  },

  exportScrollPosition: function () {
    var imageSize = IMAGE_SIZE / this.getZoomLevel();
    this.node.scrollLeft = this.attentionLeft * TILE_X_COUNT * imageSize;
    this.node.scrollTop  = this.attentionTop * TILE_Y_COUNT * imageSize;
  },

  importScrollPosition: function () {
    var imageSize = IMAGE_SIZE / this.getZoomLevel();
    this.attentionLeft = this.node.scrollLeft / (TILE_X_COUNT * imageSize);
    this.attentionTop  = this.node.scrollTop / (TILE_Y_COUNT * imageSize);
  },

  computeVisibleTiles: function () {
    var imageSize = IMAGE_SIZE / this.getZoomLevel();
    var scrollLeft = this.attentionLeft * TILE_X_COUNT * imageSize - this.clientWidth / 2;
    var scrollTop  = this.attentionTop * TILE_Y_COUNT * imageSize - this.clientHeight / 2;
    this.fvlx = clampLocalX(Math.floor(scrollLeft / imageSize));
    this.lvlx = clampLocalX(Math.floor((scrollLeft + this.clientWidth - 1) / imageSize));
    this.fvly = clampLocalY(Math.floor(scrollTop / imageSize));
    this.lvly = clampLocalY(Math.floor((scrollTop + this.clientHeight - 1) / imageSize));
    this.fvtx = localToTileX(this.fvlx);
    this.lvtx = localToTileX(this.lvlx);
    this.fvty = localToTileY(this.fvly);
    this.lvty = localToTileY(this.lvly);
  },

  isTileVisible: function (tileId) {
    var txy = tileId.split("-");
    var tx = parseInt(txy[0]);
    var ty = parseInt(txy[1]);
    return this.isTileVisible_(tx, ty);
  },

  isTileVisible_: function (tx, ty) {
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
    var tz = parseInt(txyz[2]);
    return this.isImageVisible_(tx, ty, tz);
  },

  isImageVisible_: function (tx, ty, tz) {
    var zoomPower = this.getZoomPower();
    return (
      this.isTileVisible_(tx, ty) && (
        tz === Math.floor(zoomPower) ||
        tz === Math.ceil(zoomPower)));
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
    if (!this.pendingZoom) {
      clearTimeout(this.pendingLoad);
      this.pendingLoad = setTimeout(this.loadVisibleTilesNow, 0);
    }
  },

  loadVisibleTilesNow: function () {
    var zoomPower = this.getZoomPower();
    var ps = spiral(this.lvtx - this.fvtx + 1, this.fvty - this.lvty + 1);
    var tileIds = [];
    for (var i = 0; i < ps.length; i++) {
      var tx = this.fvtx + ps[i].x;
      var ty = this.lvty + ps[i].y;
      var tileId = tx + "-" + ty;
      if (!(tileId in MISSING_TILE_IDS)) {
        if (!(tileId in this.tileData)) {
          tileIds.push(tileId);
        } else {
          var floorImageId = tileId + "-" + Math.floor(zoomPower);
          var ceilImageId  = tileId + "-" + Math.ceil(zoomPower);
          if (!(floorImageId in this.imageData)) {
            this.imageQueue.push(floorImageId);
          }
          if (ceilImageId !== floorImageId && !(ceilImageId in this.imageData)) {
            this.imageQueue.push(ceilImageId);
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
      var zoomPower = this.getZoomPower();
      var floorImageId = tileId + "-" + Math.floor(zoomPower);
      var ceilImageId  = tileId + "-" + Math.ceil(zoomPower);
      this.imageQueue.push(floorImageId);
      if (ceilImageId !== floorImageId) {
        this.imageQueue.push(ceilImageId);
      }
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
    var zoomPower = parseInt(txyz[2]);
    var zoomLevel = computeZoomLevel(zoomPower);
    var imageSize = window.devicePixelRatio * IMAGE_SIZE / zoomLevel;
    var canvas = document.createElement("canvas");
    canvas.width  = imageSize;
    canvas.height = imageSize;
    var c = canvas.getContext("2d");
    c.scale(imageSize / TILE_SIZE, imageSize / TILE_SIZE);
    c.translate(-tx * TILE_SIZE, -ty * TILE_SIZE);
    c.strokeStyle = this.props.roadLinkColor;
    c.fillStyle = this.props.roadNodeColor;
    c.globalCompositeOperation = "screen";
    this.renderRoadLinks(c, zoomLevel, tileData.roadLinks);
    this.renderRoadNodes(c, zoomLevel, tileData.roadNodes);
    return canvas;
  },


  paint: function () {
    if (!this.pendingPaint) {
      this.pendingPaint = true;
      this.storedZoomPower = this.getZoomPower();
      window.requestAnimationFrame(this.paintNow);
    }
  },

  paintNow: function () {
    var width  = window.devicePixelRatio * this.clientWidth;
    var height = window.devicePixelRatio * this.clientHeight;
    var canvas = this.canvas;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
    }
    var c = canvas.getContext("2d", {alpha: false});
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.scale(window.devicePixelRatio, window.devicePixelRatio);
    c.save();
    c.fillStyle = this.props.backgroundColor;
    c.fillRect(0, 0, this.clientWidth, this.clientHeight);
    this.paintTileBorders(c);
    c.restore();
    c.save();
    this.paintTileContents(c);
    c.restore();
    if (this.state.invertColor) {
      c.globalCompositeOperation = "difference";
      c.fillStyle = "#fff";
      c.fillRect(0, 0, this.clientWidth, this.clientHeight);
      c.globalCompositeOperation = "source-over";
    }
    this.pendingPaint = false;
  },

  paintTileBorders: function (c) {
    var zoomPower  = this.storedZoomPower;
    var zoomLevel  = computeZoomLevel(zoomPower);
    var imageSize  = IMAGE_SIZE / zoomLevel;
    var scrollLeft = this.attentionLeft * TILE_X_COUNT * imageSize - this.clientWidth / 2;
    var scrollTop  = this.attentionTop * TILE_Y_COUNT * imageSize - this.clientHeight / 2;
    c.translate(-scrollLeft + 0.25, -scrollTop + 0.25);
    c.scale(1 / zoomLevel, 1 / zoomLevel);
    c.lineWidth = 0.5 * zoomLevel;
    c.fillStyle = c.strokeStyle = this.props.borderColor;
    c.font = 24 * Math.sqrt(zoomLevel) + "px " + this.props.borderFont;
    c.textAlign = "left";
    c.textBaseline = "top";
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
        var tx = localToTileX(lx);
        var ty = localToTileY(ly);
        if (zoomPower < 3) {
          c.globalAlpha = 1 - (zoomPower - 2);
          c.fillText(tx + "×" + ty, lx * IMAGE_SIZE + 4 * Math.sqrt(zoomLevel), ly * IMAGE_SIZE);
          c.globalAlpha = 1;
        }
        c.strokeRect(lx * IMAGE_SIZE, ly * IMAGE_SIZE, IMAGE_SIZE, IMAGE_SIZE);
      }
    }
  },

  getImage: function (lx, ly, zoomPower) {
    var tx = localToTileX(lx);
    var ty = localToTileY(ly);
    for (var p = Math.round(zoomPower); p >= 0; p--) {
      var imageId = tx + "-" + ty + "-" + p;
      if (imageId in this.imageData) {
        return this.imageData[imageId];
      }
    }
    for (var p = Math.round(zoomPower); p <= MAX_ZOOM_POWER; p++) {
      var imageId = tx + "-" + ty + "-" + p;
      if (imageId in this.imageData) {
        return this.imageData[imageId];
      }
    }
    return null;
  },

  paintTileContents: function (c) {
    var zoomPower  = this.storedZoomPower;
    var zoomLevel  = computeZoomLevel(zoomPower);
    var imageSize  = IMAGE_SIZE / zoomLevel;
    var scrollLeft = this.attentionLeft * TILE_X_COUNT * imageSize - this.clientWidth / 2;
    var scrollTop  = this.attentionTop * TILE_Y_COUNT * imageSize - this.clientHeight / 2;
    c.translate(-scrollLeft, -scrollTop);
    c.scale(1 / zoomLevel, -1 / zoomLevel);
    c.translate(0, -TILE_Y_COUNT * IMAGE_SIZE);
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
        var imageData = this.getImage(lx, ly, zoomPower);
        if (imageData) {
          c.drawImage(imageData, lx * IMAGE_SIZE, (TILE_Y_COUNT - ly - 1) * IMAGE_SIZE, IMAGE_SIZE, IMAGE_SIZE);
        }
      }
    }
  },


  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    if (event.keyCode >= 49 && event.keyCode <= 58) {
      this.tweenZoomPower(event.keyCode - 49, 500);
    } else if (event.keyCode === 187) {
      this.tweenZoomPower(Math.max(0, (Math.round(this.state.zoomPower * 10) - 2) / 10), 500);
    } else if (event.keyCode === 189) {
      this.tweenZoomPower(Math.min((Math.round(this.state.zoomPower * 10) + 2) / 10, MAX_ZOOM_POWER), 500);
    } else if (event.keyCode === 67) {
      this.setState({
          invertColor: !this.state.invertColor
        });
    }
  },

  onClick: function (event) {
    // console.log("click", event.clientX, event.clientY);
  },

  render: function () {
    var imageSize = IMAGE_SIZE / this.getZoomLevel();
    return (
      r.div("map-frame",
        r.canvas("map-picture"),
        r.div({
            className: "map-space",
            style: {
              width:  TILE_X_COUNT * imageSize,
              height: TILE_Y_COUNT * imageSize
            },
            onClick: this.onClick
          })));
  }
};

r.makeComponent("App", module);
