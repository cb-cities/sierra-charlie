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
  this.hoveredRoadNode = null;
  this.hoveredRoadNodeIndices = new Indexset();
  this.hoveredRoadLink = null;
  this.hoveredRoadLinkIndices = new Indexset();
  this.selectedRoadNode = null;
  this.selectedRoadNodeIndices = new Indexset();
  this.selectedRoadLink = null;
  this.selectedRoadLinkIndices = new Indexset();
  var frame = document.getElementById("map-frame");
  frame.addEventListener("scroll", this.onFrameScrolled.bind(this));
  var canvas = document.getElementById("map-canvas");
  canvas.addEventListener("webglcontextlost", this.onCanvasContextLost.bind(this));
  canvas.addEventListener("webglcontextrestored", this.onCanvasContextRestored.bind(this));
  var space = document.getElementById("map-space");
  space.addEventListener("mousemove", this.onMouseMoved.bind(this));
  space.addEventListener("click", this.onMouseClicked.bind(this));
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

  findClosestFeature: function (clientP) {
    var clientWidth = this.getClientWidth();
    var clientHeight = this.getClientHeight();
    var centerX = App.getCenterX();
    var centerY = App.getCenterY();
    var zoom = App.getZoom();
    var cursorP = compute.fromClientPoint(clientP, clientWidth, clientHeight, centerX, centerY, zoom);
    var cursorR = compute.fromClientRect(vector.bounds(16, clientP), clientWidth, clientHeight, centerX, centerY, zoom)
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
        roadNode: closestRoadNode,
        cursorP: cursorP
      };
    } else if (closestRoadLink) {
      return {
        key: "roadLink",
        roadLink: closestRoadLink,
        cursorP: cursorP
      };
    } else {
      return {
        cursorP: cursorP
      };
    }
  },

  updateHovered: function (clientX, clientY) {
    var result = this.findClosestFeature({
        x: clientX,
        y: clientY
      });
    this.hoveredRoadNode = null;
    this.hoveredRoadNodeIndices.clear();
    this.hoveredRoadLink = null;
    this.hoveredRoadLinkIndices.clear();
    if (result.key === "roadNode") {
      var index = this.geometry.getRoadNodeIndex(result.roadNode);
      this.hoveredRoadNode = result.roadNode;
      this.hoveredRoadNodeIndices.insertPoint(index);
      UI.ports.setHoveredToid.send(result.roadNode.toid);
    } else if (result.key === "roadLink") {
      var indices = this.geometry.getRoadLinkIndices(result.roadLink);
      this.hoveredRoadLink = result.roadLink;
      this.hoveredRoadLinkIndices.insertLine(indices);
      UI.ports.setHoveredToid.send(result.roadLink.toid);
    } else {
      UI.ports.setHoveredToid.send(null);
    }
    UI.ports.setHoveredLocation.send(result.cursorP);

    var gl = App.drawingContext.gl; // TODO
    this.hoveredRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
    this.hoveredRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
    App.isDrawingNeeded = true; // TODO
  },

  updateSelected: function (clientX, clientY) {
    this.selectedRoadNode = null;
    this.selectedRoadNodeIndices.clear();
    this.selectedRoadLink = null;
    this.selectedRoadLinkIndices.clear();
    if (this.hoveredRoadNode) {
      this.selectedRoadNode = this.hoveredRoadNode;
      this.selectedRoadNodeIndices.copy(this.hoveredRoadNodeIndices);
      UI.ports.setSelectedToid.send(this.selectedRoadNode.toid);
      var p = this.geometry.getRoadNodePoint(this.selectedRoadNode);
      UI.ports.setSelectedLocation.send([p]);
    } else if (this.hoveredRoadLink) {
      this.selectedRoadLink = this.hoveredRoadLink;
      this.selectedRoadLinkIndices.copy(this.hoveredRoadLinkIndices);
      UI.ports.setSelectedToid.send(this.selectedRoadLink.toid);
      var ps = this.geometry.getRoadLinkPoints(this.selectedRoadLink);
      UI.ports.setSelectedLocation.send([ps[0], ps[ps.length - 1]]);
    } else {
      UI.ports.setSelectedToid.send(null);
      UI.ports.setSelectedLocation.send([]);
    }

    var gl = App.drawingContext.gl; // TODO
    this.selectedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
    this.selectedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
    App.isDrawingNeeded = true; // TODO
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
      var newCenterX = compute.centerXFromScrollLeft(frame.scrollLeft, zoom);
      var newCenterY = compute.centerYFromScrollTop(frame.scrollTop, zoom);
      App.setStaticCenter(newCenterX, newCenterY);
    }
    this.updateHovered(this.prevClientX, this.prevClientY);
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
    this.updateHovered(event.clientX, event.clientY);
    this.prevClientX = event.clientX;
    this.prevClientY = event.clientY;
  },

  onMouseClicked: function (event) {
    this.updateSelected(event.clientX, event.clientY);
  },

  onMouseDoubleClicked: function (event) {
    // console.log("doubleClick", event.clientX, event.clientY);
    var clientWidth = this.getClientWidth();
    var clientHeight = this.getClientHeight();
    var centerX = App.getStaticCenterX();
    var centerY = App.getStaticCenterY();
    var zoom = App.getStaticZoom();
    var duration = event.shiftKey ? 2500 : 500;
    var newCenterX = compute.clampX(compute.fromClientX(event.clientX, clientWidth, centerX, zoom));
    var newCenterY = compute.clampY(compute.fromClientY(event.clientY, clientHeight, centerY, zoom));
    var newZoom = compute.clampZoom(event.altKey ? zoom + 1 : zoom - 1);
    App.setCenterX(newCenterX, duration);
    App.setCenterY(newCenterY, duration);
    App.setZoom(newZoom, duration);
  },

  onKeyPressed: function (event) {
    // console.log("keyDown", event.keyCode);
    var clientWidth = this.getClientWidth();
    var clientHeight = this.getClientHeight();
    var centerX = App.getStaticCenterX();
    var centerY = App.getStaticCenterY();
    var rawTime = App.getStaticRawTime();
    var zoom = App.getStaticZoom();
    var pageWidth = compute.fromClientWidth(clientWidth, zoom);
    var pageHeight = compute.fromClientHeight(clientHeight, zoom);
    var duration = event.shiftKey ? 2500 : 500;
    // var timeDelta = (event.ctrlKey || event.altKey) ? 60 : 3600;
    var zoomDelta = (event.altKey || event.ctrlKey) ? 2 : 10; // TODO
    switch (event.keyCode) {
      case 37: // left
      case 36: // home
        var scale = event.keyCode === 36 ? 1 : 10;
        App.setCenterX(compute.clampX(centerX - pageWidth / scale), duration);
        break;
      case 39: // right
      case 35: // end
        var scale = event.keyCode === 35 ? 1 : 10;
        App.setCenterX(compute.clampX(centerX + pageWidth / scale), duration);
        break;
      case 38: // up
      case 33: // page up
        var scale = event.keyCode === 33 ? 1 : 10;
        App.setCenterY(compute.clampY(centerY + pageHeight / scale), duration);
        break;
      case 40: // down
      case 34: // page down
        var scale = event.keyCode === 34 ? 1 : 10;
        App.setCenterY(compute.clampY(centerY - pageHeight / scale), duration);
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
        var newZoom = compute.clampZoom(Math.round((zoom * 10) - zoomDelta) / 10);
        App.setZoom(newZoom, duration);
        break;
      case 189: // minus
        var newZoom = compute.clampZoom(Math.round((zoom * 10) + zoomDelta) / 10);
        App.setZoom(newZoom, duration);
        break;
      default: // 1-8
        if (event.keyCode >= 49 && event.keyCode <= 57) {
          var newZoom = compute.clampZoom(event.keyCode - 49);
          App.setZoom(newZoom, duration);
        }
    }
  },

  onWindowResized: function () {
    App.isDrawingNeeded = true; // TODO
  }
};

module.exports = Controller;
