"use strict";

var Geometry = require("./Geometry");
var Grid = require("./Grid");
var Indexset = require("./Indexset");
var Polyquadtree = require("./Polyquadtree");
var Quadtree = require("./Quadtree");

var compute = require("./compute");
var defs = require("./defs");
var polyline = require("./polyline");
var vector = require("./vector");


function Controller() {
  this.prevClientX = 0;
  this.prevClientY = 0;
  window.Geometry = this.geometry = new Geometry({ // TODO
      onRoadNodesLoaded: this.onRoadNodesLoaded.bind(this),
      onRoadLinksLoaded: this.onRoadLinksLoaded.bind(this)
    });
  window.Grid = this.grid = new Grid(); // TODO
  window.RoadNodeTree = this.roadNodeTree = new Quadtree(defs.quadtreeLeft, defs.quadtreeTop, defs.quadtreeSize, this.geometry.getRoadNodePoint.bind(this.geometry)); // TODO
  window.RoadLinkTree = this.roadLinkTree = new Polyquadtree(defs.quadtreeLeft, defs.quadtreeTop, defs.quadtreeSize, this.geometry.getRoadLinkBounds.bind(this.geometry)); // TODO
  this.hoveredRoadNodeIndices = new Indexset();
  this.hoveredRoadLinkIndices = new Indexset();
  var frame = document.getElementById("map-frame");
  frame.addEventListener("scroll", this.onFrameScrolled.bind(this));
  var canvas = document.getElementById("map-canvas");
  canvas.addEventListener("webglcontextlost", this.onCanvasContextLost.bind(this));
  canvas.addEventListener("webglcontextrestored", this.onCanvasContextRestored.bind(this));
  var space = document.getElementById("map-space");
  space.addEventListener("mousemove", this.onMouseMoved.bind(this));
  space.addEventListener("dblclick", this.onMouseDoubleClicked.bind(this));
  window.addEventListener("keydown", this.onKeyPressed.bind(this));
  window.addEventListener("resize", this.onWindowResized.bind(this));
  window.addEventListener("orientationchange", this.onWindowResized.bind(this));
  window.matchMedia("screen and (min-resolution: 2dppx)").addListener(this.onWindowResized.bind(this));
}

Controller.prototype = {
  getClientWidth: function () {
    var canvas = document.getElementById("map-canvas");
    return canvas.clientWidth;
  },

  getClientHeight: function () {
    var canvas = document.getElementById("map-canvas");
    return canvas.clientHeight;
  },

  fromClientPoint: function (x, y) {
    var width = this.getClientWidth();
    var height = this.getClientHeight();
    var left = App.getLeft();
    var top = App.getTop();
    var zoom = App.getZoom();
    var zoomLevel = compute.zoomLevel(zoom);
    var dilation = defs.clientTileRatio * zoomLevel; // TODO: Compare with drawing
    var translationX = defs.firstTileX + left * defs.spaceWidth;
    var translationY = defs.lastTileY + defs.tileSize - top * defs.spaceHeight;
    return {
      x: (x - width / 2) * dilation + translationX,
      y: ((height - y) - height / 2) * dilation + translationY
    };
  },

  fromClientRect: function (r) {
    var bottomLeft = this.fromClientPoint(r.left, r.top);
    var topRight = this.fromClientPoint(r.right, r.bottom);
    return {
      left: bottomLeft.x,
      top: topRight.y,
      right: topRight.x,
      bottom: bottomLeft.y
    };
  },
  
  findClosestFeature: function (x, y) {
    var cursorP = this.fromClientPoint(x, y);
    var cursorR = this.fromClientRect(vector.bounds(16, {
        x: x,
        y: y
      }));
    var roadNodes = this.roadNodeTree.select(cursorR);
    var closestRoadNodeDistance = Infinity;
    var closestRoadNode = null;
    for (var i = 0; i < roadNodes.length; i++) {
      var p = this.geometry.getRoadNodePoint(roadNodes[i])
      var distance = vector.distance(cursorP, p);
      if (distance < closestRoadNodeDistance) {
        closestRoadNodeDistance = distance;
        closestRoadNode = roadNodes[i];
      }
    }
    var roadLinks = this.roadLinkTree.select(cursorR);
    var closestRoadLinkDistance = Infinity;
    var closestRoadLink = null;
    for (var i = 0; i < roadLinks.length; i++) {
      var ps = this.geometry.getRoadLinkPoints(roadLinks[i]);
      var distance = polyline.distance(cursorP, ps);
      if (distance < closestRoadLinkDistance) {
        closestRoadLinkDistance = distance;
        closestRoadLink = roadLinks[i];
      }
    }
    if (closestRoadNode && closestRoadNodeDistance <= closestRoadLinkDistance + 4) {
      return {
        key: "roadNode",
        roadNode: closestRoadNode
      };
    } else if (closestRoadLink) {
      return {
        key: "roadLink",
        roadLink: closestRoadLink
      };
    } else {
      return {};
    }
  },

  updateHover: function (x, y) {
    var result = this.findClosestFeature(x, y);
    this.hoveredRoadNodeIndices.clear();
    this.hoveredRoadLinkIndices.clear();
    if (result.key === "roadNode") {
      var index = this.geometry.getRoadNodeIndex(result.roadNode);
      this.hoveredRoadNodeIndices.insertPoint(index);
      UI.ports.setHoveredToid.send(result.roadNode.toid);
    } else if (result.key === "roadLink") {
      var indices = this.geometry.getRoadLinkIndices(result.roadLink);
      this.hoveredRoadLinkIndices.insertLine(indices);
      UI.ports.setHoveredToid.send(result.roadLink.toid);
    } else {
      UI.ports.setHoveredToid.send(null);
    }

    var gl = App.drawingContext.gl; // TODO
    this.hoveredRoadNodeIndices.render(gl, gl.STREAM_DRAW);
    this.hoveredRoadLinkIndices.render(gl, gl.STREAM_DRAW);
    App.isDrawingNeeded = true; // TODO
    App.hoveredRoadNodeIndices = this.hoveredRoadNodeIndices; // OMG
    App.hoveredRoadLinkIndices = this.hoveredRoadLinkIndices; // OMG
  },

  onRoadNodesLoaded: function (roadNodes) {
    for (var i = 0; i < roadNodes.length; i++) {
      this.roadNodeTree.insert(roadNodes[i]);
    }
    App.updateDrawingContext(); // TODO
    UI.ports.setLoadingProgress.send(this.geometry.getLoadingProgress());
  },

  onRoadLinksLoaded: function (roadLinks) {
    for (var i = 0; i < roadLinks.length; i++) {
      this.roadLinkTree.insert(roadLinks[i]);
    }
    App.updateDrawingContext(); // TODO
    UI.ports.setLoadingProgress.send(this.geometry.getLoadingProgress());
  },

  onFrameScrolled: function (event) {
    if (!(App.isScrolling())) {
      var frame = document.getElementById("map-frame");
      var zoom = App.getZoom();
      var newLeft = compute.leftFromClientScrollLeft(frame.scrollLeft, zoom);
      var newTop = compute.topFromClientScrollTop(frame.scrollTop, zoom);
      App.setStaticLeftTop(newLeft, newTop);
    }
    this.updateHover(this.prevClientX, this.prevClientY);
  },

  onCanvasContextLost: function (event) {
    event.preventDefault();
    // cancelAnimationFrame(this.isAnimationFrameRequested); // TODO
    // this.isAnimationFrameRequested = null;
    // this.drawingContext = null;
  },

  onCanvasContextRestored: function () {
    // this.startDrawing(); // TODO
  },

  onMouseMoved: function (event) {
    // console.log("mouseMove", event.clientX, event.clientY);
    this.updateHover(event.clientX, event.clientY);
    this.prevClientX = event.clientX;
    this.prevClientY = event.clientY;
  },

  onMouseDoubleClicked: function (event) {
    // console.log("doubleClick", event.clientX, event.clientY);
    var width = this.getClientWidth();
    var height = this.getClientHeight();
    var left = App.getStaticLeft();
    var top = App.getStaticTop();
    var zoom = App.getStaticZoom();
    var newLeft = compute.leftFromClientX(event.clientX, width, left, zoom);
    var newTop = compute.topFromClientY(event.clientY, height, top, zoom);
    var newZoom = event.altKey ? Math.min(zoom + 1, defs.maxZoom) : Math.max(0, zoom - 1);
    var duration = event.shiftKey ? 2500 : 500;
    App.setLeft(newLeft, duration);
    App.setTop(newTop, duration);
    App.setZoom(newZoom, duration);
  },

  onKeyPressed: function (event) {
    // console.log("keyDown", event.keyCode);
    var width = this.getClientWidth();
    var height = this.getClientHeight();
    var left = App.getStaticLeft();
    var top = App.getStaticTop();
    var rawTime = App.getStaticRawTime();
    var zoom = App.getStaticZoom();
    var pageWidth = compute.clientPageWidth(width, zoom);
    var pageHeight = compute.clientPageHeight(height, zoom);
    var duration = event.shiftKey ? 2500 : 500;
    // var timeDelta = (event.ctrlKey || event.altKey) ? 60 : 3600;
    var zoomDelta = (event.altKey || event.ctrlKey) ? 2 : 10;
    switch (event.keyCode) {
      case 37: // left
      case 36: // home
        var newLeft = Math.max(0, left - pageWidth / (event.keyCode === 36 ? 1 : 10));
        App.setLeft(newLeft, duration);
        break;
      case 39: // right
      case 35: // end
        var newLeft = Math.min(left + pageWidth / (event.keyCode === 35 ? 1 : 10), 1);
        App.setLeft(newLeft, duration);
        break;
      case 38: // up
      case 33: // page up
        var newTop = Math.max(0, top - pageHeight / (event.keyCode === 33 ? 1 : 10));
        App.setTop(newTop, duration);
        break;
      case 40: // down
      case 34: // page down
        var newTop = Math.min(top + pageHeight / (event.keyCode === 34 ? 1 : 10), 1);
        App.setTop(newTop, duration);
        break;
      // case 219: // left bracket
      //   var newRawTime = Math.round((rawTime * 3600) - timeDelta) / 3600;
      //   App.setRawTime(newRawTime, duration);
      //   break;
      // case 221: // right bracket
      //   var newRawTime = Math.round((rawTime * 3600) + timeDelta) / 3600;
      //   App.setRawTime(newRawTime, duration);
      //   break;
      case 187: // plus
        var newZoom = Math.max(0, (Math.round((zoom * 10) - zoomDelta) / 10));
        App.setZoom(newZoom, duration);
        break;
      case 189: // minus
        var newZoom = Math.min(Math.round((zoom * 10) + zoomDelta) / 10, defs.maxZoom);
        App.setZoom(newZoom, duration);
        break;
      default: // 1-8
        if (event.keyCode >= 49 && event.keyCode <= 57) {
          var newZoom = Math.max(0, Math.min(event.keyCode - 49, defs.maxZoom));
          App.setZoom(newZoom, duration);
        }
    }
  },

  onWindowResized: function () {
    App.isDrawingNeeded = true; // TODO
  }
};

module.exports = Controller;
