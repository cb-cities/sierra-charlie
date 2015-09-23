"use strict";

var r = require("react-wrapper");
var easeTween = require("ease-tween");
var tweenState = require("react-tween-state");
var Loader = require("worker?inline!./loader");
var MISSING_TILE_IDS = require("./missing-tile-ids");

var TILE_SIZE    = 1000;
var IMAGE_SIZE   = 1024;
var FIRST_TILE_X = 490;
var LAST_TILE_X  = 572;
var FIRST_TILE_Y = 148;
var LAST_TILE_Y  = 208;
var TILE_X_COUNT = LAST_TILE_X - FIRST_TILE_X + 1;
var TILE_Y_COUNT = LAST_TILE_Y - FIRST_TILE_Y + 1;

var MAX_ZOOM_POWER = 8;


function isTileValid(tx, ty) {
  return (
    tx >= FIRST_TILE_X && tx <= LAST_TILE_X &&
    ty >= FIRST_TILE_Y && ty <= LAST_TILE_Y);
}

// function tileToLocalX(tx) {
//   return tx - FIRST_TILE_X;
// }
//
// function tileToLocalY(ty) {
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

function printTileId(tx, ty) {
  return tx + "-" + ty;
}

function scanTileId(tileId) {
  var txy = tileId.split("-");
  return {
    x: parseInt(txy[0]),
    y: parseInt(txy[1])
  };
}

function printImageId(tx, ty, zoomPower) {
  return tx + "-" + ty + "-" + zoomPower;
}

function scanImageId(imageId) {
  var txyz = imageId.split("-");
  return {
    x: parseInt(txyz[0]),
    y: parseInt(txyz[1]),
    z: parseInt(txyz[2])
  };
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

  hasTile: function (tileId) {
    return tileId in this.tileData;
  },

  getTile: function (tileId) {
    return this.tileData[tileId];
  },

  setTile: function (tileId, tileData) {
    this.tileData[tileId] = tileData;
  },

  hasImage: function (imageId) {
    return imageId in this.imageData;
  },

  getImage: function (imageId) {
    return this.imageData[imageId];
  },

  setImage: function (imageId, imageData) {
    this.imageData[imageId] = imageData;
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
    // this.queueAllTiles();
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
    this.fvty = localToTileY(this.lvly);
    this.lvty = localToTileY(this.fvly);
  },

  isTileIdVisible: function (tileId) {
    var t = scanTileId(tileId);
    return this.isTileVisible(t.x, t.y);
  },

  isTileVisible: function (tx, ty) {
    return (
      tx >= this.fvtx && tx <= this.lvtx &&
      ty >= this.fvty && ty <= this.lvty);
  },

  isImageIdVisible: function (imageId) {
    var t = scanImageId(imageId);
    return this.isImageVisible(t.x, t.y, t.z);
  },

  isImageVisible: function (tx, ty, tz) {
    var zoomPower = this.getZoomPower();
    return (
      this.isTileVisible(tx, ty) && (
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

  queueAllTiles: function () {
    var tx = localToTileX(Math.floor(this.attentionLeft * TILE_X_COUNT));
    var ty = localToTileY(Math.floor(this.attentionTop * TILE_Y_COUNT));
    var k = Math.max(
      Math.max(tx, LAST_TILE_X - tx),
      Math.max(ty, LAST_TILE_Y - ty));
    var tileIds = [];
    function push(tx, ty) {
      if (isTileValid(tx, ty)) {
        var tileId = printTileId(tx, ty);
        if (!(tileId in MISSING_TILE_IDS)) {
          tileIds.push(tileId);
        }
      }
    }
    push(tx, ty);
    for (var n = 0; n <= k; n++) {
      for (var i = 0; i < n * 2; i++) {
        push(tx + n,           ty + i - (n - 1));
        push(tx - i + (n - 1), ty + n);
        push(tx - n,           ty - i + (n - 1));
        push(tx + i - (n - 1), ty - n);
      }
    }
    tileIds.reverse();
    this.loader.postMessage({
        message: "queueTiles",
        tileIds: tileIds
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
    var tx = localToTileX(Math.floor(this.attentionLeft * TILE_X_COUNT));
    var ty = localToTileY(Math.floor(this.attentionTop * TILE_Y_COUNT));
    var k = Math.max(
      Math.max(tx - this.fvtx, this.lvtx - tx),
      Math.max(ty - this.fvty, this.lvty - ty));
    var isTileVisible = this.isTileVisible;
    var tileIds = [];
    var hasTile = this.hasTile;
    var imageIds = [];
    var hasImage = this.hasImage;
    function push(tx, ty) {
      if (isTileVisible(tx, ty)) {
        var tileId = printTileId(tx, ty);
        if (!(tileId in MISSING_TILE_IDS)) {
          if (!hasTile(tileId)) {
            tileIds.push(tileId);
          } else {
            var floorImageId = printImageId(tx, ty, Math.floor(zoomPower));
            var ceilImageId  = printImageId(tx, ty, Math.ceil(zoomPower));
            if (!hasImage(floorImageId)) {
              imageIds.push(floorImageId);
            }
            if (ceilImageId !== floorImageId && !hasImage(ceilImageId)) {
              imageIds.push(ceilImageId);
            }
          }
        }
      }
    }
    push(tx, ty);
    for (var n = 0; n <= k; n++) {
      for (var i = 0; i < n * 2; i++) {
        push(tx + n,           ty + i - (n - 1));
        push(tx - i + (n - 1), ty + n);
        push(tx - n,           ty - i + (n - 1));
        push(tx + i - (n - 1), ty - n);
      }
    }
    tileIds.reverse();
    imageIds.reverse();
    this.loader.postMessage({
        message: "queueTiles",
        tileIds: tileIds
      });
    this.loader.postMessage({
        message: "loadNextTile"
      });
    this.imageQueue = this.imageQueue.concat(imageIds);
    this.renderNextImage();
  },

  tileDidLoad: function (tileId, tileData) {
    this.setTile(tileId, tileData);
    if (this.isTileIdVisible(tileId)) {
      var t = scanTileId(tileId);
      var zoomPower = this.getZoomPower();
      var floorImageId = printImageId(t.x, t.y, Math.floor(zoomPower));
      var ceilImageId  = printImageId(t.x, t.y, Math.ceil(zoomPower));
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
      if (!this.hasImage(imageId) && this.isImageIdVisible(imageId)) {
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
    var t = scanImageId(imageId);
    var tileId = printTileId(t.x, t.y);
    var tileData = this.getTile(tileId);
    var zoomLevel = computeZoomLevel(t.z);
    var imageSize = window.devicePixelRatio * IMAGE_SIZE / zoomLevel;
    var canvas = document.createElement("canvas");
    canvas.width  = imageSize;
    canvas.height = imageSize;
    var c = canvas.getContext("2d");
    c.scale(imageSize / TILE_SIZE, imageSize / TILE_SIZE);
    c.translate(-t.x * TILE_SIZE, -t.y * TILE_SIZE);
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

  getApproximateImage: function (lx, ly, zoomPower) {
    var tx = localToTileX(lx);
    var ty = localToTileY(ly);
    for (var tz = Math.round(zoomPower); tz >= 0; tz--) {
      var imageId = printImageId(tx, ty, tz);
      var imageData = this.getImage(imageId);
      if (imageData) {
        return imageData;
      }
    }
    for (var tz = Math.round(zoomPower); tz <= MAX_ZOOM_POWER; tz++) {
      var imageId = printImageId(tx, ty, tz);
      var imageData = this.getImage(imageId);
      if (imageData) {
        return imageData;
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
        var imageData = this.getApproximateImage(lx, ly, zoomPower);
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
