"use strict";

var AddressBook = require("./AddressBook");
var Geometry = require("./Geometry");
var Grid = require("./Grid");
var Indexset = require("./Indexset");
var Polyquadtree = require("./Polyquadtree");
var Quadtree = require("./Quadtree");

var compute = require("./compute");
var defs = require("./defs");
var polyline = require("./polyline");
var rect = require("./rect");
var vector = require("./vector");


function Controller() {
  this.prevClientX = 0;
  this.prevClientY = 0;
  this.prevClickDate = 0;
  window.Geometry = this.geometry = new Geometry({ // TODO
      onRoadNodesLoaded: this.onRoadNodesLoaded.bind(this),
      onRoadLinksLoaded: this.onRoadLinksLoaded.bind(this)
    });
  window.AddressBook = this.addressBook = new AddressBook({ // TODO
      onAddressesLoaded: this.onAddressesLoaded.bind(this)
    });
  this.loadingProgress = {
    geometry: 0,
    addressBook: 0
  };
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

  findClosestFeature: function (clientP) {
    var cursorP = this.fromClientPoint(clientP);
    var cursorR = this.fromClientRect(vector.bounds(16, clientP));
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

  updateHoveredAddress: function () {
    if (this.hoveredRoadNode) {
      var address = this.addressBook.getRoadNodeAddress(this.hoveredRoadNode);
      UI.ports.setHoveredAddress.send(address);
    } else {
      UI.ports.setHoveredAddress.send(null);
    }
  },

  updateSelectedAddress: function () {
    if (this.selectedRoadNode) {
      var address = this.addressBook.getRoadNodeAddress(this.selectedRoadNode);
      UI.ports.setSelectedAddress.send(address);
    } else {
      UI.ports.setSelectedAddress.send(null);
    }
  },

  updateHoveredGeometry: function (clientX, clientY) {
    var result = this.findClosestFeature({
        x: clientX,
        y: clientY
      });
    this.hoveredRoadNode = null;
    this.hoveredRoadNodeIndices.clear();
    this.hoveredRoadLink = null;
    this.hoveredRoadLinkIndices.clear();
    UI.ports.setHoveredLocation.send(result.cursorP);
    if (result.key === "roadNode") {
      this.hoveredRoadNode = result.roadNode;
      var index = this.geometry.getRoadNodeIndex(this.hoveredRoadNode);
      this.hoveredRoadNodeIndices.insertPoint(index);
      var p = this.geometry.getRoadNodePoint(this.hoveredRoadNode);
      UI.ports.setHoveredAnchor.send(this.toClientPoint(p));
      UI.ports.setHoveredToid.send(this.hoveredRoadNode.toid);
    } else if (result.key === "roadLink") {
      this.hoveredRoadLink = result.roadLink;
      var indices = this.geometry.getRoadLinkIndices(this.hoveredRoadLink);
      this.hoveredRoadLinkIndices.insertLine(indices);
      var ps = this.geometry.getRoadLinkPoints(this.hoveredRoadLink);
      UI.ports.setHoveredAnchor.send(polyline.approximateMidpoint(ps));
      UI.ports.setHoveredToid.send(this.hoveredRoadLink.toid);
    } else {
      UI.ports.setHoveredAnchor.send(null);
      UI.ports.setHoveredToid.send(null);
    }
    this.updateHoveredAddress();

    var gl = App.drawingContext.gl; // TODO
    this.hoveredRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
    this.hoveredRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
    App.isDrawingNeeded = true; // TODO
  },

  updateSelectedGeometry: function (clientX, clientY) {
    this.selectedRoadNode = null;
    this.selectedRoadNodeIndices.clear();
    this.selectedRoadLink = null;
    this.selectedRoadLinkIndices.clear();
    if (this.hoveredRoadNode) {
      this.selectedRoadNode = this.hoveredRoadNode;
      this.selectedRoadNodeIndices.copy(this.hoveredRoadNodeIndices);
      var p = this.geometry.getRoadNodePoint(this.selectedRoadNode);
      UI.ports.setSelectedToid.send(this.selectedRoadNode.toid);
      UI.ports.setSelectedLocation.send([p]);
      UI.ports.setSelectedAnchor.send(this.toClientPoint(p));
    } else if (this.hoveredRoadLink) {
      this.selectedRoadLink = this.hoveredRoadLink;
      this.selectedRoadLinkIndices.copy(this.hoveredRoadLinkIndices);
      var ps = this.geometry.getRoadLinkPoints(this.hoveredRoadLink);
      UI.ports.setSelectedLocation.send([ps[0], ps[ps.length - 1]]);
      UI.ports.setSelectedAnchor.send(polyline.approximateMidpoint(ps));
      UI.ports.setSelectedToid.send(this.selectedRoadLink.toid);
    } else {
      UI.ports.setSelectedLocation.send([]);
      UI.ports.setSelectedAnchor.send(null);
      UI.ports.setSelectedToid.send(null);
    }
    this.updateSelectedAddress();

    var gl = App.drawingContext.gl; // TODO
    this.selectedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
    this.selectedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
    App.isDrawingNeeded = true; // TODO
  },

  updateLoadingProgress: function (source, loadedCount) {
    switch (source) {
      case "geometry":
        this.loadingProgress.geometry = loadedCount;
        break;
      case "addressBook":
        this.loadingProgress.addressBook = loadedCount;
        break;
    }
    var count = this.loadingProgress.geometry + this.loadingProgress.addressBook;
    var maxCount = defs.maxVertexCount + defs.maxAddressCount; // TODO;
    UI.ports.setLoadingProgress.send(count / maxCount * 100);
  },

  onRoadNodesLoaded: function (roadNodes, vertexCount) {
    for (var i = 0; i < roadNodes.length; i++) {
      this.roadNodeTree.insert(roadNodes[i]);
    }
    App.updateDrawingContext(); // TODO
    this.updateLoadingProgress("geometry", vertexCount);
    this.updateHoveredGeometry(this.prevClientX, this.prevClientY);
  },

  onRoadLinksLoaded: function (roadLinks, vertexCount) {
    for (var i = 0; i < roadLinks.length; i++) {
      this.roadLinkTree.insert(roadLinks[i]);
    }
    App.updateDrawingContext(); // TODO
    this.updateLoadingProgress("geometry", vertexCount);
    this.updateHoveredGeometry(this.prevClientX, this.prevClientY);
  },

  onAddressesLoaded: function (addresses, addressCount) {
    this.updateLoadingProgress("addressBook", addressCount);
    this.updateSelectedAddress();
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
    // console.log("mouseMove", event.clientX, event.clientY);
    this.updateHoveredGeometry(event.clientX, event.clientY);
    this.prevClientX = event.clientX;
    this.prevClientY = event.clientY;
  },

  onMouseClicked: function (event) {
    if (this.prevClickDate + 250 < Date.now()) {
      // console.log("click", event.clientX, event.clientY, Date.now() - this.prevClickDate);
      this.prevClickDate = Date.now();
      var duration = event.shiftKey ? 2500 : 500;
      this.updateSelectedGeometry(this.clientX, event.clientY);
      this.prevClientX = event.clientX;
      this.prevClientY = event.clientY;
      if (this.selectedRoadNode) {
        var p = this.geometry.getRoadNodePoint(this.selectedRoadNode);
        App.setCenter(p, duration);
      } else if (this.selectedRoadLink) {
        var ps = this.geometry.getRoadLinkPoints(this.selectedRoadLink);
        App.setCenter(polyline.approximateMidpoint(ps), duration);
      }
    } else {
      // console.log("no click", event.clientX, event.clientY, Date.now() - this.prevClickDate);
    }
  },

  onMouseDoubleClicked: function (event) {
    // console.log("doubleClick", event.clientX, event.clientY);
    var duration = event.shiftKey ? 2500 : 500;
    if (!this.selectedRoadNode && !this.selectedRoadLink) {
      var newCenter = compute.clampPoint(this.fromClientPoint({
          x: event.clientX,
          y: event.clientY
        }));
      App.setCenter(newCenter, duration);
    }
    var zoom = App.getZoom();
    var newZoom = compute.clampZoom(event.altKey ? zoom + 1 : zoom - 1);
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
              event.keyCode === 48 ? 7 : event.keyCode - 49 - 2);
          App.setZoom(newZoom, duration);
        }
    }
  },

  onWindowResized: function () {
    App.isDrawingNeeded = true; // TODO
  }
};

module.exports = Controller;
