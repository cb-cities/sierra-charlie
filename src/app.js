"use strict";

var r = require("react-wrapper");
var Loader = require("worker?inline!./loader");

var ROAD_LINK_COLOR = "#f63";
var ROAD_NODE_COLOR = "#f93";
var ROAD_LINK_SCALE = 0.5;
var ROAD_NODE_SCALE = 1.25;

var TILE_SIZE    = 1000;
var FIRST_TILE_X = 490;
var LAST_TILE_X  = 572;
var FIRST_TILE_Y = 148;
var LAST_TILE_Y  = 208;
var TILE_X_COUNT = LAST_TILE_X - FIRST_TILE_X + 1;
var TILE_Y_COUNT = LAST_TILE_Y - FIRST_TILE_Y + 1;
// var INITIAL_TILE_X = 530;
// var INITIAL_TILE_Y = 180;

var ZOOM_LEVELS = [1, 2, 4, 5, 8, 10, 20, 25, 40, 50];

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
      Math.floor(px / (TILE_SIZE * zoomRatio)),
      TILE_X_COUNT - 1));
}

function pointToLocalY(py, zoomRatio) {
  return (
    Math.min(
      Math.floor(py / (TILE_SIZE * zoomRatio)),
      TILE_Y_COUNT - 1));
}

module.exports = {
  getInitialState: function () {
    return {
      zoomLevel: 20
    };
  },

  componentDidMount: function () {
    this.node = r.domNode(this);
    this.canvas = this.node.firstChild;
    this.scrollLeft = this.node.scrollLeft;
    this.scrollTop = this.node.scrollTop;
    this.clientWidth = this.node.clientWidth;
    this.clientHeight = this.node.clientHeight;
    this.node.addEventListener("scroll", this.onScroll);
    addEventListener("resize", this.onResize);
    addEventListener("keydown", this.onKeyDown);
    this.startLoader();
    this.prepareRenderer();
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
    this.scrollTop = this.node.scrollTop;
    this.computeVisibleTiles();
    this.loadVisibleTiles();
    this.paint();
  },

  onResize: function (event) {
    this.clientWidth = this.node.clientWidth;
    this.clientHeight = this.node.clientHeight;
    this.computeVisibleTiles();
    this.loadVisibleTiles();
    this.paint();
  },





  computeVisibleTiles: function () {
    var zoomRatio = 1 / this.state.zoomLevel;
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
    return (
      zoomLevel === this.state.zoomLevel &&
      this.isTileVisibleSplit(tx, ty));
  },





  startLoader: function () {
    this.tileData = {};
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

  loadVisibleTilesNow: function () { // TODO: split in half
    for (var ty = this.lvty; ty <= this.fvty; ty++) {
      for (var tx = this.lvtx; tx >= this.fvtx; tx--) {
        var tileId = tx + "-" + ty;
        if (!(tileId in this.tileData)) {
          this.loader.postMessage({ // TODO: post one message
              message: "queueTile",
              tileId:  tileId
            });
        } else { // TODO: split off
          var imageId = tileId + "-" + this.state.zoomLevel;
          if (!(imageId in this.imageData)) {
            this.queueImage(imageId);
          }
        }
      }
    }
    this.loader.postMessage({
        message: "loadTiles"
      });
    this.renderNextImage();
  },

  tileDidLoad: function (tileId, tileData) {
    this.tileData[tileId] = tileData;
    if (this.isTileVisible(tileId)) {
      var imageId = tileId + "-" + this.state.zoomLevel;
      this.queueImage(imageId);
      this.renderNextImage();
      // setTimeout(this.renderNextImage, 0); // TODO: timeout?
    }
  },




  prepareRenderer: function () {
    this.imageData = {};
    this.imageQueue = [];
    this.queuedImages = {};
  },

  queueImage: function (imageId) {
    if (imageId in this.imageData) {
      return;
    }
    this.imageQueue.push(imageId);
    this.queuedImages[imageId] = true;
  },

  renderNextImage: function () {
    var pendingImageId;
    while (this.imageQueue.length) {
      var imageId = this.imageQueue.pop();
      delete this.queuedImages[imageId];
      if (!(imageId in this.imageData) && this.isImageVisible(imageId)) {
        pendingImageId = imageId;
        break;
      }
    }
    if (!pendingImageId) {
      return;
    }
    var imageData = this.renderImage(pendingImageId);
    this.imageData[pendingImageId] = imageData;
    this.paint();
    setTimeout(this.renderNextImage, 0);
  },

  renderImage: function (imageId) {
    var txyz = imageId.split("-"); // TODO: refactor
    var tx = parseInt(txyz[0]);
    var ty = parseInt(txyz[1]);
    var zoomLevel = parseInt(txyz[2]);
    var tileId = tx + "-" + ty;
    var tileData = this.tileData[tileId];
    var zoomRatio = 1 / zoomLevel;
    var canvas = document.createElement("canvas");
    canvas.width = TILE_SIZE * zoomRatio * window.devicePixelRatio;
    canvas.height = TILE_SIZE * zoomRatio * window.devicePixelRatio;
    var c = canvas.getContext("2d");
    c.scale(zoomRatio * window.devicePixelRatio, zoomRatio * window.devicePixelRatio);
    c.translate(-(tx * TILE_SIZE), -(ty * TILE_SIZE));
    c.strokeStyle = ROAD_LINK_COLOR;
    c.fillStyle = ROAD_NODE_COLOR;
    c.lineWidth = ROAD_LINK_SCALE * zoomLevel;
    c.globalCompositeOperation = "screen";
    for (var i = 0; i < tileData.roadLinks.length; i++) {
      var ps = tileData.roadLinks[i].ps;
      c.beginPath();
      c.moveTo(ps[0].x, ps[0].y);
      for (var j = 1; j < ps.length; j++) {
        c.lineTo(ps[j].x, ps[j].y);
      }
      c.stroke();
    }
    var rectSize = ROAD_NODE_SCALE * zoomLevel;
    for (var i = 0; i < tileData.roadNodes.length; i++) {
      var p = tileData.roadNodes[i].p;
      c.fillRect(p.x - rectSize, p.y - rectSize, rectSize * 2, rectSize * 2);
    }
    return canvas;
  },


/*

  renderVisibleImages: function () {
    clearTimeout(this.pendingRender);
    this.pendingRender = setTimeout(this.renderVisibleImagesNow, 100); // TODO: timeout?
  },

  renderVisibleImagesNow: function () {
    for (var ty = this.lvty; ty <= this.fvty; ty++) {
      for (var tx = this.lvtx; tx >= this.fvtx; tx--) {
        var imageId = tx + "-" + ty + "-" + this.state.zoomLevel;
        if (!(imageId in this.imageData)) {
          this.queueImage(imageId);
        }
      }
    }
    this.renderNextImage();
  },
*/







  paint: function () {
    if (this.pendingPaint) {
      return;
    }
    this.pendingPaint = true;
    window.requestAnimationFrame(this.paintNow);
  },

  paintNow: function () {
    var zoomRatio = 1 / this.state.zoomLevel;
    var c = this.prepareCanvas();
    c.translate(0.5, 0.5);
    c.translate(-this.scrollLeft, -this.scrollTop);
    c.scale(zoomRatio, zoomRatio);
    this.paintTileBorders(c);
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.scale(window.devicePixelRatio, window.devicePixelRatio);
    c.scale(zoomRatio, -zoomRatio);
    c.translate(-(FIRST_TILE_X * TILE_SIZE), -(FIRST_TILE_Y * TILE_SIZE));
    c.translate(-(this.scrollLeft * this.state.zoomLevel), -(TILE_Y_COUNT * TILE_SIZE - (this.scrollTop * this.state.zoomLevel)));
    this.paintTileContents(c);
    this.pendingPaint = false;
  },

  prepareCanvas: function () {
    var width = this.clientWidth * window.devicePixelRatio;
    var height = this.clientHeight * window.devicePixelRatio;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    var c = this.canvas.getContext("2d", {
        alpha: false
      });
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.scale(window.devicePixelRatio, window.devicePixelRatio);
    c.fillStyle = "#000";
    c.fillRect(0, 0, width, height);
    c.fillStyle = "#333";
    c.strokeStyle = "#333";
    c.lineWidth = this.state.zoomLevel;
    c.font = '10px "Helvetica Neue", Helvetica, Arial, sans-serif';
    c.textAlign = "left";
    c.textBaseline = "top";
    return c;
  },

  paintTileBorders: function (c) {
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
        var tx = localToTileX(lx);
        var ty = localToTileY(ly);
        if (this.state.zoomLevel <= 1) {
          c.fillText(tx + "×" + ty, lx * TILE_SIZE + 5, ly * TILE_SIZE + 5);
        }
        c.strokeRect(lx * TILE_SIZE, ly * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        if (tx === LAST_TILE_X) {
          c.beginPath();
          c.moveTo((lx + 1) * TILE_SIZE - 1, ly * TILE_SIZE);
          c.lineTo((lx + 1) * TILE_SIZE - 1, (ly + 1) * TILE_SIZE);
          c.stroke();
        }
        if (ty === FIRST_TILE_Y) {
          c.beginPath();
          c.moveTo(lx * TILE_SIZE, (ly + 1) * TILE_SIZE - 1);
          c.lineTo((lx + 1) * TILE_SIZE, (ly + 1) * TILE_SIZE - 1);
          c.stroke();
        }
      }
    }
  },

  paintTileContents: function (c) {
    for (var ty = this.lvty; ty <= this.fvty; ty++) {
      for (var tx = this.lvtx; tx >= this.fvtx; tx--) {
        var imageId = tx + "-" + ty + "-" + this.state.zoomLevel;
        if (imageId in this.imageData) {
          c.drawImage(this.imageData[imageId], tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  },



  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    if (event.keyCode >= 49 && event.keyCode <= 58) {
      this.setState({
          zoomLevel: ZOOM_LEVELS[event.keyCode - 49]
        });
    } else if (event.keyCode === 48) {
      this.setState({
          zoomLevel: ZOOM_LEVELS[event.keyCode - 48 + 9]
        });
    }
  },

  onClick: function (event) {
    // console.log("click", event.clientX, event.clientY);
  },

  render: function () {
    var zoomRatio = 1 / this.state.zoomLevel;
    return (
      r.div("map-frame",
        r.canvas("map-picture"),
        r.div({
            className: "map-space",
            style: {
              width: TILE_X_COUNT * TILE_SIZE * zoomRatio,
              height: TILE_Y_COUNT * TILE_SIZE * zoomRatio
            },
            onClick: this.onClick
          })));
  }
};

r.makeComponent("App", module);
