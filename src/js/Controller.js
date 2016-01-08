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
  this.prevClickDate = 0;
  window.Geometry = this.geometry = new Geometry({ // TODO
      onRoadNodesLoaded: this.onRoadNodesLoaded.bind(this),
      onRoadLinksLoaded: this.onRoadLinksLoaded.bind(this),
      onRoadsLoaded: this.onRoadsLoaded.bind(this)
    });
  window.Grid = this.grid = new Grid(); // TODO
  window.RoadNodeTree = this.roadNodeTree = new Quadtree(defs.quadtreeLeft, defs.quadtreeTop, defs.quadtreeSize, this.geometry.getRoadNodePoint.bind(this.geometry)); // TODO
  window.RoadLinkTree = this.roadLinkTree = new Polyquadtree(defs.quadtreeLeft, defs.quadtreeTop, defs.quadtreeSize, this.geometry.getRoadLinkBounds.bind(this.geometry)); // TODO
  this.hoveredFeature = null;
  this.hoveredRoadNodeIndices = new Indexset();
  this.hoveredRoadLinkIndices = new Indexset();
  this.selectedFeature = null;
  this.selectedRoadNodeIndices = new Indexset();
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

  fromClientPoint: function (clientP) {
    var clientWidth = this.getClientWidth();
    var clientHeight = this.getClientHeight();
    var centerX = App.getCenterX();
    var centerY = App.getCenterY();
    var zoom = App.getZoom();
    return compute.fromClientPoint(clientP, clientWidth, clientHeight, centerX, centerY, zoom);
  },

  fromClientRect: function (clientR) {
    var clientWidth = this.getClientWidth();
    var clientHeight = this.getClientHeight();
    var centerX = App.getCenterX();
    var centerY = App.getCenterY();
    var zoom = App.getZoom();
    return compute.fromClientRect(clientR, clientWidth, clientHeight, centerX, centerY, zoom);
  },

  toClientPoint: function (p) {
    var clientWidth = this.getClientWidth();
    var clientHeight = this.getClientHeight();
    var centerX = App.getCenterX();
    var centerY = App.getCenterY();
    var zoom = App.getZoom();
    return compute.toClientPoint(p, clientWidth, clientHeight, centerX, centerY, zoom);
  },

  findClosestFeature: function (cursorP, cursorR) {
    var roadNodes = this.roadNodeTree.select(cursorR);
    var closestRoadNodeDistance = Infinity;
    var closestRoadNode = null;
    for (var i = 0; i < roadNodes.length; i++) {
      var p = this.geometry.getRoadNodePoint(roadNodes[i]);
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
        tag: "roadNode",
        roadNode: closestRoadNode,
        roadLink: null
      };
    } else if (closestRoadLink) {
      return {
        tag: "roadLink",
        roadLink: closestRoadLink,
        roadNode: null
      };
    } else {
      return null;
    }
  },

  updateFeatureUI: function () {
    var hoveredFeatureToSend = this.hoveredFeature;
    if (this.hoveredFeature && this.selectedFeature) {
      if (this.hoveredFeature.tag === this.selectedFeature.tag) {
        switch (this.hoveredFeature.tag) {
          case "roadNode":
            if (this.hoveredFeature.roadNode.toid === this.selectedFeature.roadNode.toid) {
              hoveredFeatureToSend = null;
            }
            break;
          case "roadLink":
            if (this.hoveredFeature.roadLink.toid === this.selectedFeature.roadLink.toid) {
              hoveredFeatureToSend = null;
            }
            break;
        }
      }
    }
    UI.ports.setHoveredFeature.send(hoveredFeatureToSend);
    UI.ports.setSelectedFeature.send(this.selectedFeature);
  },

  updateHoveredGeometry: function (clientX, clientY) {
    var clientP = {
      x: clientX,
      y: clientY
    };
    var cursorP = this.fromClientPoint(clientP);
    var cursorR = this.fromClientRect(vector.bounds(16, clientP));
    this.hoveredFeature = this.findClosestFeature(cursorP, cursorR);
    this.hoveredRoadNodeIndices.clear();
    this.hoveredRoadLinkIndices.clear();
    if (this.hoveredFeature) {
      switch (this.hoveredFeature.tag) {
        case "roadNode":
          var index = this.geometry.getRoadNodeIndex(this.hoveredFeature.roadNode);
          this.hoveredRoadNodeIndices.insertPoint(index);
          break;
        case "roadLink":
          var indices = this.geometry.getRoadLinkIndices(this.hoveredFeature.roadLink);
          this.hoveredRoadLinkIndices.insertLine(indices);
          break;
      }
    }
    this.updateFeatureUI();

    var gl = App.drawingContext.gl; // TODO
    this.hoveredRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
    this.hoveredRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
    App.isDrawingNeeded = true; // TODO
  },

  updateSelectedGeometry: function (clientX, clientY) {
    this.selectedFeature = this.hoveredFeature;
    this.selectedRoadNodeIndices.clear();
    this.selectedRoadLinkIndices.clear();
    if (this.selectedFeature) {
      switch (this.selectedFeature.tag) {
        case "roadNode":
          this.selectedRoadNodeIndices.copy(this.hoveredRoadNodeIndices);
          break;
        case "roadLink":
          this.selectedRoadLinkIndices.copy(this.hoveredRoadLinkIndices);
          break;
      }
    }
    this.updateFeatureUI();

    var gl = App.drawingContext.gl; // TODO
    this.selectedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
    this.selectedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
    App.isDrawingNeeded = true; // TODO
  },

  updateLoadingProgressUI: function () {
    UI.ports.setLoadingProgress.send(this.geometry.getItemCount() / defs.maxGeometryItemCount * 100);
  },

  onRoadNodesLoaded: function (roadNodes) {
    for (var i = 0; i < roadNodes.length; i++) {
      this.roadNodeTree.insert(roadNodes[i]);
    }
    App.updateDrawingContext(); // TODO
    this.updateLoadingProgressUI();
    this.updateHoveredGeometry(this.prevClientX, this.prevClientY);
  },

  onRoadLinksLoaded: function (roadLinks) {
    for (var i = 0; i < roadLinks.length; i++) {
      this.roadLinkTree.insert(roadLinks[i]);
    }
    App.updateDrawingContext(); // TODO
    this.updateLoadingProgressUI();
    this.updateHoveredGeometry(this.prevClientX, this.prevClientY);
  },

  onRoadsLoaded: function (roads) { // TODO: Attach road data to road links
    this.updateLoadingProgressUI();
    this.updateFeatureUI();
  },

  onAddressesLoaded: function (addresses) {
    this.updateLoadingProgressUI();
    this.updateFeatureUI();
  },

  onFrameScrolled: function (event) {
    if (!(App.isScrolling())) {
      var frame = document.getElementById("map-frame");
      var zoom = App.getZoom();
      var newCenterX = compute.centerXFromScrollLeft(frame.scrollLeft, zoom);
      var newCenterY = compute.centerYFromScrollTop(frame.scrollTop, zoom);
      App.setStaticCenter(newCenterX, newCenterY);
    }
    this.updateHoveredGeometry(this.prevClientX, this.prevClientY);
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
    this.updateHoveredGeometry(event.clientX, event.clientY);
    this.prevClientX = event.clientX;
    this.prevClientY = event.clientY;
  },

  onMouseClicked: function (event) { // TODO: Refactor
    if (this.prevClickDate + 250 < Date.now()) {
      this.prevClickDate = Date.now();
      var duration = event.shiftKey ? 2500 : 500;
      this.updateSelectedGeometry(this.clientX, event.clientY);
      this.prevClientX = event.clientX;
      this.prevClientY = event.clientY;
      if (this.selectedFeature) {
        switch (this.selectedFeature.tag) {
          case "roadNode":
            var p = this.geometry.getRoadNodePoint(this.selectedFeature.roadNode);
            App.setCenter(p, duration);
            break;
          case "roadLink":
            var clientWidth = this.getClientWidth();
            var clientHeight = this.getClientHeight();
            var zoom = App.getZoom();
            var ps = this.geometry.getRoadLinkPoints(this.selectedFeature.roadLink);
            var r = polyline.bounds(10, ps);
            var newZoom = compute.clampZoom(Math.max(zoom, compute.zoomForRect(r, clientWidth, clientHeight)));
            App.setZoom(newZoom, duration);
            App.setCenter(polyline.approximateMidpoint(ps), duration);
            break;
        }
      }
    }
  },

  onMouseDoubleClicked: function (event) { // TODO: Refactor
    var duration = event.shiftKey ? 2500 : 500;
    var zoom = App.getZoom();
    if (this.selectedFeature) {
      switch (this.selectedFeature.tag) {
        case "roadNode":
          var newZoom = compute.clampZoom(event.altKey ? zoom + 1 : Math.min(zoom - 1, 2));
          App.setZoom(newZoom, duration);
          break;
        case "roadLink":
          var clientWidth = this.getClientWidth();
          var clientHeight = this.getClientHeight();
          var ps = this.geometry.getRoadLinkPoints(this.selectedFeature.roadLink);
          var r = polyline.bounds(10, ps);
          var newZoom = compute.clampZoom(event.altKey ? zoom + 1 : compute.zoomForRect(r, clientWidth, clientHeight));
          App.setZoom(newZoom, duration);
          break;
      }
    } else {
      var newZoom = compute.clampZoom(event.altKey ? zoom + 1 : zoom - 1);
      var newCenter = compute.clampPoint(this.fromClientPoint({
          x: event.clientX,
          y: event.clientY
        }));
      App.setZoom(newZoom, duration);
      App.setCenter(newCenter, duration);
    }
  },

  onKeyPressed: function (event) {
    var clientWidth = this.getClientWidth();
    var clientHeight = this.getClientHeight();
    var centerX = App.getStaticCenterX();
    var centerY = App.getStaticCenterY();
    // var rawTime = App.getStaticRawTime();
    var zoom = App.getStaticZoom();
    var pageWidth = compute.fromClientWidth(clientWidth, zoom);
    var pageHeight = compute.fromClientHeight(clientHeight, zoom);
    var duration = event.shiftKey ? 2500 : 500;
    // var timeDelta = event.altKey ? 60 : 3600;
    var zoomDelta = event.altKey ? 2 : 10; // TODO
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
      default: // 1-9, 0
        if (event.keyCode >= 49 && event.keyCode <= 57 || event.keyCode === 48) {
          var newZoom = compute.clampZoom(
              event.keyCode === 48 ? 10 : event.keyCode - 49);
          App.setZoom(newZoom, duration);
        }
    }
  },

  onWindowResized: function () {
    App.isDrawingNeeded = true; // TODO
  }
};

module.exports = Controller;
