"use strict";

var r = require("react-wrapper");
// var LoaderWorker = require("worker?inline!./loader-worker");
var LoaderWorker = require("worker!./loader-worker");

require("./app.css");

var TILE_SIZE    = 1000;
var FIRST_TILE_X = 490;
var LAST_TILE_X  = 572;
var FIRST_TILE_Y = 148;
var LAST_TILE_Y  = 208;
// var INITIAL_TILE_X = 530;
// var INITIAL_TILE_Y = 180;
var TILE_X_COUNT = LAST_TILE_X - FIRST_TILE_X + 1;
var TILE_Y_COUNT = LAST_TILE_Y - FIRST_TILE_Y + 1;
var ROAD_LINK_COLOR = "#f63";
var ROAD_NODE_COLOR = "#f93";
var ROAD_LINK_SCALE = 0.5;
var ROAD_NODE_SCALE = 1.25;


var ZOOM_LEVELS = [1, 2, 4, 5, 8, 10, 20, 25, 40, 50];

function localToGlobalTileX(lx) {
  return FIRST_TILE_X + lx;
}

function localToGlobalTileY(ly) {
  return LAST_TILE_Y - ly;
}

// function globalToLocalTileX(gx) {
//   return gx - FIRST_TILE_X;
// }
//
// function globalToLocalTileY(gy) {
//   return LAST_TILE_Y - gy;
// }

function deviceIndependent(n) {
  return n * window.devicePixelRatio;
}

function resetContextTransform(c) {
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.scale(deviceIndependent(1), deviceIndependent(1));
}

module.exports = {
  getInitialState: function () {
    return {
      zoomLevel: 10
    };
  },

  componentDidMount: function () {
    this.tileUrlBase = location.origin + "/json/";
    this.loaderData = {};
    this.loaderWorker = new LoaderWorker();
    this.loaderWorker.addEventListener("message", this.onTileLoaded);
    this.rendererData = {};
    this.renderer_queuedReqs = {};
    this.renderer_queuedReqIds = [];
    this.node = r.domNode(this);
    this.canvas = this.node.firstChild;
    this.scrollLeft = this.node.scrollLeft;
    this.scrollTop = this.node.scrollTop;
    this.clientWidth = this.node.clientWidth;
    this.clientHeight = this.node.clientHeight;
    this.node.addEventListener("scroll", this.onScroll);
    addEventListener("resize", this.onResize);
    addEventListener("keydown", this.onKeyDown);
    this.computeVisibleTiles();
    this.requestAllTiles();
    this.requestVisibleTiles();
    this.requestPaint();
  },

  renderer_queueRequest: function (req) {
    if (req.id in this.rendererData) {
      return;
    }
    this.renderer_queuedReqs[req.id] = req;
    this.renderer_queuedReqIds.push(req.id);
  },

  renderer_performNextRequest: function () {
    var reqId;
    var req;
    while (true) {
      reqId = this.renderer_queuedReqIds.pop();
      if (!reqId) {
        return;
      }
      req = this.renderer_queuedReqs[reqId];
      if (!req) {
        return;
      }
      this.renderer_queuedReqs[reqId] = undefined;
      if (!(req.id in this.rendererData)) {
        if (this.isTileVisible(req.tile.gx, req.tile.gy, req.zoomLevel)) {
          break;
        }
      }
    }
    var canvas = this.renderImageCanvas(req.tile, req.zoomLevel);
    var image = {
      tile: req.tile,
      zoomLevel: req.zoomLevel,
      id: req.id,
      canvas: canvas
    };
    this.rendererData[req.id] = image;
    this.requestPaint();
    setTimeout(this.renderer_performNextRequest, 0);
  },

  componentWillUnmount: function () {
    this.loaderWorker.terminate();
    this.loaderWorker.removeEventListener("message", this.onTileLoaded);
    this.node.removeEventListener("scroll", this.onScroll);
    removeEventListener("resize", this.onResize);
    removeEventListener("keydown", this.onKeyDown);
  },

  componentDidUpdate: function () {
    this.computeVisibleTiles();
    this.requestVisibleTiles();
    this.requestPaint();
  },

  onScroll: function (event) {
    this.scrollLeft = this.node.scrollLeft;
    this.scrollTop = this.node.scrollTop;
    this.computeVisibleTiles();
    this.requestVisibleTiles();
    this.requestPaint();
  },

  onResize: function (event) {
    this.clientWidth = this.node.clientWidth;
    this.clientHeight = this.node.clientHeight;
    this.computeVisibleTiles();
    this.requestVisibleTiles();
    this.requestPaint();
  },

  requestPaint: function () {
    if (!this.isPainting) {
      this.isPainting = true;
      window.requestAnimationFrame(this.paint);
    }
  },

  requestAllTiles: function () {
    for (var gy = FIRST_TILE_Y; gy <= LAST_TILE_Y; gy++) {
      for (var gx = LAST_TILE_X; gx >= FIRST_TILE_X; gx--) {
        var tileId = "tile-" + gx + "-" + gy;
        var tileUrl = this.tileUrlBase + tileId + (process.env.NODE_ENV === "production" ? ".json.gz" : ".json");
        this.loaderWorker.postMessage({
            cmd: "queueRequest",
            req: {
              gx: gx,
              gy: gy,
              id: tileId,
              url: tileUrl
            }
          });
      }
    }
    this.loaderWorker.postMessage({
        cmd: "performNextRequest"
      });
  },

  requestVisibleTiles: function () {
    clearTimeout(this.visibleTilesTimeout);
    this.visibleTilesTimeout = setTimeout(function () {
        for (var gy = this.lvgy; gy <= this.fvgy; gy++) {
          for (var gx = this.lvgx; gx >= this.fvgx; gx--) {
            var tileId = "tile-" + gx + "-" + gy;
            var tile = this.loaderData[tileId];
            if (!tile) {
              var tileUrl = this.tileUrlBase + tileId + (process.env.NODE_ENV === "production" ? ".json.gz" : ".json");
              this.loaderWorker.postMessage({
                  cmd: "queueRequest",
                  req: {
                    gx: gx,
                    gy: gy,
                    id: tileId,
                    url: tileUrl
                  }
                });
            } else {
              var imageId = "image-" + gx + "-" + gy + "-" + this.state.zoomLevel;
              this.renderer_queueRequest({
                  tile: tile,
                  zoomLevel: this.state.zoomLevel,
                  id: imageId
                });
            }
          }
        }
        this.loaderWorker.postMessage({
            cmd: "performNextRequest"
          });
        this.renderer_performNextRequest();
      }.bind(this),
      100);
  },

  onTileLoaded: function (event) {
    var tile = event.data;
    this.loaderData[tile.id] = tile;
    if (this.isTileVisible(tile.gx, tile.gy)) {
      var imageId = "image-" + tile.gx + "-" + tile.gy + "-" + this.state.zoomLevel;
      this.renderer_queueRequest({
          tile: tile,
          zoomLevel: this.state.zoomLevel,
          id: imageId
        });
      setTimeout(this.renderer_performNextRequest, 0);
    }
  },

  renderImageCanvas: function (tile, zoomLevel) {
    var canvas = document.createElement("canvas");
    canvas.width = deviceIndependent(TILE_SIZE / zoomLevel);
    canvas.height = deviceIndependent(TILE_SIZE / zoomLevel);
    var c = canvas.getContext("2d");
    c.scale(deviceIndependent(1 / zoomLevel), deviceIndependent(1 / zoomLevel));
    c.translate(-(tile.gx * TILE_SIZE), -(tile.gy * TILE_SIZE));
    c.strokeStyle = ROAD_LINK_COLOR;
    c.fillStyle = ROAD_NODE_COLOR;
    c.lineWidth = ROAD_LINK_SCALE * zoomLevel;
    c.globalCompositeOperation = "screen";
    for (var i = 0; i < tile.roadLinks.length; i++) {
      var ps = tile.roadLinks[i].ps;
      c.beginPath();
      c.moveTo(ps[0].x, ps[0].y);
      for (var j = 1; j < ps.length; j++) {
        c.lineTo(ps[j].x, ps[j].y);
      }
      c.stroke();
    }
    var rectSize = ROAD_NODE_SCALE * zoomLevel;
    for (var i = 0; i < tile.roadNodes.length; i++) {
      var p = tile.roadNodes[i].p;
      c.fillRect(p.x - rectSize, p.y - rectSize, rectSize * 2, rectSize * 2);
    }
    return canvas;
  },

  onKeyDown: function (event) {
    console.log("keyDown", event.keyCode);
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
    console.log("click", event.clientX, event.clientY);
  },

  prepareCanvas: function () {
    var width = deviceIndependent(this.clientWidth);
    var height = deviceIndependent(this.clientHeight);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    var c = this.canvas.getContext("2d", {
        alpha: false
      });
    resetContextTransform(c);
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

  paintTileContents: function (c) {
    for (var gy = this.lvgy; gy <= this.fvgy; gy++) {
      for (var gx = this.lvgx; gx >= this.fvgx; gx--) {
        var imageId = "image-" + gx + "-" + gy + "-" + this.state.zoomLevel;
        var image = this.rendererData[imageId];
        if (image) {
          c.drawImage(image.canvas, gx * TILE_SIZE, gy * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  },

  paintTileBorders: function (c) {
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
        var gx = localToGlobalTileX(lx);
        var gy = localToGlobalTileY(ly);
        if (this.state.zoomLevel <= 1) {
          c.fillText(gx + "×" + gy, lx * TILE_SIZE + 5, ly * TILE_SIZE + 5);
        }
        c.strokeRect(lx * TILE_SIZE, ly * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        if (gx === LAST_TILE_X) {
          c.beginPath();
          c.moveTo((lx + 1) * TILE_SIZE - 1, ly * TILE_SIZE);
          c.lineTo((lx + 1) * TILE_SIZE - 1, (ly + 1) * TILE_SIZE);
          c.stroke();
        }
        if (gy === FIRST_TILE_Y) {
          c.beginPath();
          c.moveTo(lx * TILE_SIZE, (ly + 1) * TILE_SIZE - 1);
          c.lineTo((lx + 1) * TILE_SIZE, (ly + 1) * TILE_SIZE - 1);
          c.stroke();
        }
      }
    }
  },

  paint: function () {
    var zoomRatio = 1 / this.state.zoomLevel;
    var c = this.prepareCanvas();
    c.translate(0.5, 0.5);
    c.translate(-this.scrollLeft, -this.scrollTop);
    c.scale(zoomRatio, zoomRatio);
    this.paintTileBorders(c);
    resetContextTransform(c);
    c.scale(zoomRatio, -zoomRatio);
    c.translate(-(FIRST_TILE_X * TILE_SIZE), -(FIRST_TILE_Y * TILE_SIZE));
    c.translate(-(this.scrollLeft / zoomRatio), -(TILE_Y_COUNT * TILE_SIZE - (this.scrollTop / zoomRatio)));
    this.paintTileContents(c);
    this.isPainting = false;
  },

  pointToLocalTileX: function (px) {
    var zoomRatio = 1 / this.state.zoomLevel;
    return (
      Math.min(
        Math.floor(px / (TILE_SIZE * zoomRatio)),
        TILE_X_COUNT - 1));
  },

  pointToLocalTileY: function (py) {
    var zoomRatio = 1 / this.state.zoomLevel;
    return (
      Math.min(
        Math.floor(py / (TILE_SIZE * zoomRatio)),
        TILE_Y_COUNT - 1));
  },

  computeVisibleTiles: function () {
    this.fvlx = this.pointToLocalTileX(this.scrollLeft);
    this.lvlx = this.pointToLocalTileX(this.scrollLeft + this.clientWidth - 1);
    this.fvly = this.pointToLocalTileY(this.scrollTop);
    this.lvly = this.pointToLocalTileY(this.scrollTop + this.clientHeight - 1);
    this.fvgx = localToGlobalTileX(this.fvlx);
    this.lvgx = localToGlobalTileX(this.lvlx);
    this.fvgy = localToGlobalTileY(this.fvly);
    this.lvgy = localToGlobalTileY(this.lvly);
  },

  isTileVisible: function (gx, gy, zoomLevel) {
    return (
      gx >= this.fvgx &&
      gx <= this.lvgx &&
      gy <= this.fvgy &&
      gy >= this.lvgy &&
      (!zoomLevel || zoomLevel === this.state.zoomLevel));
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
