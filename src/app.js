"use strict";

/* global Path2D */

var r = require("react-wrapper");
var Loader = require("worker?inline!./loader.js");

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
var EXTRA_TILES  = 1;

function localToGlobalTileX(lx) {
  return FIRST_TILE_X + lx;
}

function localToGlobalTileY(ly) {
  return LAST_TILE_Y - ly;
}

function globalToLocalTileX(gx) {
  return gx - FIRST_TILE_X;
}

function globalToLocalTileY(gy) {
  return LAST_TILE_Y - gy;
}

function globalToTileId(gx, gy) {
  return "tile-" + gx + "-" + gy;
}

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
      zoomLevel: 4
    };
  },

  componentDidMount: function () {
    var node = r.domNode(this);
    this.tileData = {};
    this.maxRoadLinkCount = 0;
    this.maxRoadNodeCount = 0;
    this.loader = new Loader();
    this.loader.addEventListener("message", this.onTileLoad);
    node.addEventListener("scroll", this.onScroll);
    addEventListener("resize", this.onResize);
    addEventListener("keydown", this.onKeyDown);
    this.paint();
  },

  componentWillUnmount: function () {
    var node = r.domNode(this);
    this.loader.removeEventListener("message", this.onTileLoad);
    this.loader.terminate();
    node.removeEventListener("scroll", this.onScroll);
    removeEventListener("resize", this.onResize);
    removeEventListener("keydown", this.onKeyDown);
  },

  componentDidUpdate: function () {
    window.requestAnimationFrame(this.paint);
  },

  loadVisibleTiles: function (v) {
    var firstColumn = (
      Math.max(
        localToGlobalTileX(v.firstColumn - EXTRA_TILES),
        FIRST_TILE_X));
    var lastColumn = (
      Math.min(
        localToGlobalTileX(v.lastColumn + EXTRA_TILES),
        LAST_TILE_X));
    var firstRow = (
      Math.max(
        localToGlobalTileY(v.firstRow - EXTRA_TILES),
        FIRST_TILE_Y));
    var lastRow = (
      Math.min(
        localToGlobalTileY(v.lastRow + EXTRA_TILES),
        LAST_TILE_Y));
    for (var gy = lastRow; gy <= firstRow; gy++) {
      for (var gx = lastColumn; gx >= firstColumn; gx--) {
        var tileId = globalToTileId(gx, gy);
        if (!(tileId in this.tileData)) {
          this.loader.postMessage({
              origin: location.origin,
              gx: gx,
              gy: gy,
              tileId: tileId
            });
        }
      }
    }
  },

  isTileVisible: function (v, gx, gy) {
    var lx = globalToLocalTileX(gx);
    var ly = globalToLocalTileY(gy);
    return (
      lx >= v.firstColumn &&
      lx <= v.lastColumn &&
      ly >= v.firstRow &&
      ly <= v.lastRow);
  },

  onTileLoad: function (event) {
    this.tileData[event.data.tileId] = event.data.tileData;
    this.maxRoadLinkCount = Math.max(this.maxRoadLinkCount, event.data.tileData.roadLinks.length);
    this.maxRoadNodeCount = Math.max(this.maxRoadNodeCount, event.data.tileData.roadNodes.length);
    var v = this.computeVisibility();
    if (this.isTileVisible(v, event.data.gx, event.data.gy)) {
      window.requestAnimationFrame(this.paint);
    }
  },

  onScroll: function (event) {
    window.requestAnimationFrame(this.paint);
  },

  onResize: function (event) {
    window.requestAnimationFrame(this.paint);
  },

  onKeyDown: function (event) {
    console.log("keyDown", event.keyCode);
    var zoomLevels = [1, 2, 4, 5, 8, 10, 20, 25, 40, 50];
    if (event.keyCode >= 49 && event.keyCode <= 58) {
      this.setState({
          zoomLevel: zoomLevels[event.keyCode - 49]
        });
    } else if (event.keyCode === 48) {
      this.setState({
          zoomLevel: zoomLevels[event.keyCode - 48 + 9]
        });
    }
  },

  onClick: function (event) {
    var node = r.domNode(this);
    var px = node.scrollLeft + event.clientX;
    var py = node.scrollTop + event.clientY;
    console.log("click", px, py);
  },

  prepareCanvas: function () {
    var node = r.domNode(this);
    var clientWidth = deviceIndependent(node.clientWidth);
    var clientHeight = deviceIndependent(node.clientHeight);
    var canvas = node.firstChild;
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
      canvas.width = clientWidth;
      canvas.height = clientHeight;
    }
    var c = canvas.getContext("2d", {
        alpha: false
      });
    resetContextTransform(c);
    c.fillStyle = "#000";
    c.fillRect(0, 0, canvas.width, canvas.height);
    return c;
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

  computeVisibility: function () {
    var node = r.domNode(this);
    return {
      firstColumn: this.pointToLocalTileX(node.scrollLeft),
      lastColumn: this.pointToLocalTileX(node.scrollLeft + node.clientWidth - 1),
      firstRow: this.pointToLocalTileY(node.scrollTop),
      lastRow: this.pointToLocalTileY(node.scrollTop + node.clientHeight - 1)
    };
  },

  paintRoadLinks: function (c, gx, gy, tileData) {
    if (!tileData.roadLinksPath) {
      var k = new Path2D();
      for (var i = 0; i < tileData.roadLinks.length; i++) {
        var l = tileData.roadLinks[i];
        k.moveTo(l.ps[0].x, l.ps[0].y);
        for (var j = 1; j < l.ps.length; j++) {
          k.lineTo(l.ps[j].x, l.ps[j].y);
        }
      }
      tileData.roadLinksPath = k;
    }
    c.stroke(tileData.roadLinksPath);
  },

  paintRoadNodes: function (c, gx, gy, tileData) {
    // if (!tileData.roadNodesPath) {
    //   var k = new Path2D();
    //   for (var i = 0; i < tileData.roadNodes.length; i++) {
    //     var n = tileData.roadNodes[i];
    //     k.moveTo(n.p.x + 2, n.p.y);
    //     k.arc(n.p.x, n.p.y, 2, 0, 2 * Math.PI);
    //   }
    //   tileData.roadNodesPath = k;
    // }
    // c.fill(tileData.roadNodesPath);
    // c.stroke(tileData.roadNodesPath);
    var size = this.state.zoomLevel * 1.25;
    for (var i = 0; i < tileData.roadNodes.length; i++) {
      var n = tileData.roadNodes[i];
      c.fillRect(n.p.x - size, n.p.y - size, size * 2, size * 2);
    }
  },

  paintTileContents: function (c, v) {
    var firstColumn = localToGlobalTileX(v.firstColumn);
    var lastColumn = localToGlobalTileX(v.lastColumn);
    var firstRow = localToGlobalTileY(v.firstRow);
    var lastRow = localToGlobalTileY(v.lastRow);
    c.lineWidth = this.state.zoomLevel * 0.5;
    c.globalCompositeOperation = "screen";
    // c.strokeStyle = "#36f";
    // c.fillStyle = "#39f";
    c.strokeStyle = "#f63";
    c.fillStyle = "#f93";
    // c.strokeStyle = "#f0690f"; // "#555";
    // c.fillStyle = "#f0690f"; // "#555";
    for (var gx = firstColumn; gx <= lastColumn; gx++) {
      for (var gy = firstRow; gy >= lastRow; gy--) {
        var tileId = globalToTileId(gx, gy);
        var full = (
          gx >= firstColumn &&
          gx < lastColumn &&
          gy <= firstRow &&
          gy > lastRow);
        if (tileId in this.tileData) {
          var tileData = this.tileData[tileId];
          // c.strokeStyle = "rgba(255,102,51," + (tileData.roadLinks.length / this.maxRoadLinkCount) + ")";
          // c.fillStyle = "rgba(255,153,51," + (tileData.roadNodes.length / this.maxRoadNodeCount) +")";
          this.paintRoadLinks(c, gx, gy, tileData);
          this.paintRoadNodes(c, gx, gy, tileData);
        }
      }
    }
    c.globalCompositeOperation = "source-over";
  },

  paintTileBorders: function (c, v) {
    c.fillStyle = "#333"; // "#f0690f"; "#96f00f"; #3f96f0 0f96f0
    c.strokeStyle = "#333";
    c.lineWidth = this.state.zoomLevel;
    c.font = '10px "Helvetica Neue", Helvetica, Arial, sans-serif';
    c.textAlign = "left";
    c.textBaseline = "top";
    for (var lx = v.firstColumn; lx <= v.lastColumn; lx++) {
      for (var ly = v.firstRow; ly <= v.lastRow; ly++) {
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
    var node = r.domNode(this);
    var c = this.prepareCanvas();
    var v = this.computeVisibility();
    c.translate(0.5, 0.5);
    c.translate(-node.scrollLeft, -node.scrollTop);
    c.scale(zoomRatio, zoomRatio);
    this.paintTileBorders(c, v);
    resetContextTransform(c);
    c.scale(zoomRatio, -zoomRatio);
    c.translate(-(FIRST_TILE_X * TILE_SIZE), -(FIRST_TILE_Y * TILE_SIZE));
    c.translate(-(node.scrollLeft / zoomRatio), -(TILE_Y_COUNT * TILE_SIZE - (node.scrollTop / zoomRatio)));
    this.loadVisibleTiles(v);
    this.paintTileContents(c, v);
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
