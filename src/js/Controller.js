"use strict";

const Geometry = require("./Geometry");
const Grid = require("./Grid");
const Indexset = require("./Indexset");
const Polyquadtree = require("./Polyquadtree");
const Quadtree = require("./Quadtree");

const compute = require("./compute");
const defs = require("./defs");
const polyline = require("./polyline");
const vector = require("./vector");


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
  const frame = document.getElementById("map-frame");
  frame.addEventListener("scroll", this.onFrameScrolled.bind(this));
  const canvas = document.getElementById("map-canvas");
  canvas.addEventListener("webglcontextlost", this.onCanvasContextLost.bind(this));
  canvas.addEventListener("webglcontextrestored", this.onCanvasContextRestored.bind(this));
  const space = document.getElementById("map-space");
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
    const canvas = document.getElementById("map-canvas");
    return canvas.clientWidth;
  },

  getClientHeight: function () {
    const canvas = document.getElementById("map-canvas");
    return canvas.clientHeight;
  },

  fromClientPoint: function (clientP) {
    const clientWidth = this.getClientWidth();
    const clientHeight = this.getClientHeight();
    const centerX = App.getCenterX();
    const centerY = App.getCenterY();
    const zoom = App.getZoom();
    return compute.fromClientPoint(clientP, clientWidth, clientHeight, centerX, centerY, zoom);
  },

  fromClientRect: function (clientR) {
    const clientWidth = this.getClientWidth();
    const clientHeight = this.getClientHeight();
    const centerX = App.getCenterX();
    const centerY = App.getCenterY();
    const zoom = App.getZoom();
    return compute.fromClientRect(clientR, clientWidth, clientHeight, centerX, centerY, zoom);
  },

  toClientPoint: function (p) {
    const clientWidth = this.getClientWidth();
    const clientHeight = this.getClientHeight();
    const centerX = App.getCenterX();
    const centerY = App.getCenterY();
    const zoom = App.getZoom();
    return compute.toClientPoint(p, clientWidth, clientHeight, centerX, centerY, zoom);
  },

  findClosestFeature: function (cursorP, cursorR) { // TODO: Refactor
    const roadNodes = this.roadNodeTree.select(cursorR);
    let closestRoadNodeDistance = Infinity;
    let closestRoadNode = null;
    for (let i = 0; i < roadNodes.length; i++) {
      const p = this.geometry.getRoadNodePoint(roadNodes[i]);
      const d1 = vector.distance(cursorP, p);
      if (d1 < closestRoadNodeDistance) {
        closestRoadNodeDistance = d1;
        closestRoadNode = roadNodes[i];
      }
    }
    const roadLinks = this.roadLinkTree.select(cursorR);
    let closestRoadLinkDistance = Infinity;
    let closestRoadLink = null;
    for (let j = 0; j < roadLinks.length; j++) {
      const ps = this.geometry.getRoadLinkPoints(roadLinks[j]);
      const d2 = polyline.distance(cursorP, ps);
      if (d2 < closestRoadLinkDistance) {
        closestRoadLinkDistance = d2;
        closestRoadLink = roadLinks[j];
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
    let hoveredFeatureToSend = this.hoveredFeature;
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
    const clientP = {
      x: clientX,
      y: clientY
    };
    const cursorP = this.fromClientPoint(clientP);
    const cursorR = this.fromClientRect(vector.bounds(10, clientP));
    this.hoveredFeature = this.findClosestFeature(cursorP, cursorR);
    this.hoveredRoadNodeIndices.clear();
    this.hoveredRoadLinkIndices.clear();
    if (this.hoveredFeature) {
      switch (this.hoveredFeature.tag) {
        case "roadNode":
          const index = this.geometry.getRoadNodeIndex(this.hoveredFeature.roadNode);
          this.hoveredRoadNodeIndices.insertPoint(index);
          break;
        case "roadLink":
          const indices = this.geometry.getRoadLinkIndices(this.hoveredFeature.roadLink);
          this.hoveredRoadLinkIndices.insertLine(indices);
          break;
      }
    }
    this.updateFeatureUI();

    const gl = App.drawingContext.gl; // TODO
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

    const gl = App.drawingContext.gl; // TODO
    this.selectedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
    this.selectedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
    App.isDrawingNeeded = true; // TODO
  },

  updateLoadingProgressUI: function () {
    UI.ports.setLoadingProgress.send(this.geometry.getItemCount() / defs.maxGeometryItemCount * 100);
  },

  onRoadNodesLoaded: function (roadNodes) {
    for (let i = 0; i < roadNodes.length; i++) {
      this.roadNodeTree.insert(roadNodes[i]);
    }
    App.updateDrawingContext(); // TODO
    this.updateLoadingProgressUI();
    this.updateHoveredGeometry(this.prevClientX, this.prevClientY);
  },

  onRoadLinksLoaded: function (roadLinks) {
    for (let i = 0; i < roadLinks.length; i++) {
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
      const frame = document.getElementById("map-frame");
      const zoom = App.getZoom();
      const newCenterX = compute.centerXFromScrollLeft(frame.scrollLeft, zoom);
      const newCenterY = compute.centerYFromScrollTop(frame.scrollTop, zoom);
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

  displayFeature: function (feature, doSlowMotion, doZoom, doReverseZoom) {
    const zoom = App.getZoom();
    const duration = doSlowMotion ? 2500 : 500;
    switch (feature.tag) {
      case "roadNode":
        const p = this.geometry.getRoadNodePoint(feature.roadNode);
        App.setCenter(p, duration);
        if (doZoom) { // double-click only
          App.setZoom(compute.clampZoom(doReverseZoom ? zoom + 1 : defs.minZoom), duration);
        }
        break;
      case "roadLink":
        const ps = this.geometry.getRoadLinkPoints(feature.roadLink);
        App.setCenter(polyline.approximateMidpoint(ps), duration);
        const clientWidth = this.getClientWidth();
        const clientHeight = this.getClientHeight();
        const fittedZoom = compute.zoomForRect(polyline.bounds(10, ps), clientWidth, clientHeight);
        App.setZoom(
          doZoom ?
            compute.clampZoom(doReverseZoom ? zoom + 1 : fittedZoom) :
            Math.max(zoom, fittedZoom),
          duration);
        break;
    }
  },

  onMouseClicked: function (event) {
    if (this.prevClickDate + 250 < Date.now()) {
      this.prevClickDate = Date.now();
      this.updateSelectedGeometry(this.clientX, event.clientY);
      this.prevClientX = event.clientX;
      this.prevClientY = event.clientY;
      if (this.selectedFeature) {
        this.displayFeature(this.selectedFeature, !!event.shiftKey, false);
      }
    }
  },

  onMouseDoubleClicked: function (event) {
    if (this.selectedFeature) {
      this.displayFeature(this.selectedFeature, !!event.shiftKey, true, !!event.altKey);
    } else {
      const zoom = App.getZoom();
      const duration = event.shiftKey ? 2500 : 500;
      const newZoom = compute.clampZoom(event.altKey ? zoom + 1 : zoom - 1);
      const newCenter = compute.clampPoint(this.fromClientPoint({
          x: event.clientX,
          y: event.clientY
        }));
      App.setZoom(newZoom, duration);
      App.setCenter(newCenter, duration);
    }
  },

  onKeyPressed: function (event) {
    const clientWidth = this.getClientWidth();
    const clientHeight = this.getClientHeight();
    const centerX = App.getStaticCenterX();
    const centerY = App.getStaticCenterY();
    // const rawTime = App.getStaticRawTime();
    const zoom = App.getStaticZoom();
    const pageWidth = compute.fromClientWidth(clientWidth, zoom);
    const pageHeight = compute.fromClientHeight(clientHeight, zoom);
    const duration = event.shiftKey ? 2500 : 500;
    // const timeDelta = event.altKey ? 60 : 3600;
    const zoomDelta = event.altKey ? 2 : 10; // TODO
    switch (event.keyCode) {
      case 37: // left
      case 36: // home
        App.setCenterX(compute.clampX(centerX - pageWidth / (event.keyCode === 36 ? 1 : 10)), duration);
        break;
      case 39: // right
      case 35: // end
        App.setCenterX(compute.clampX(centerX + pageWidth / (event.keyCode === 35 ? 1 : 10)), duration);
        break;
      case 38: // up
      case 33: // page up
        App.setCenterY(compute.clampY(centerY + pageHeight / (event.keyCode === 33 ? 1 : 10)), duration);
        break;
      case 40: // down
      case 34: // page down
        App.setCenterY(compute.clampY(centerY - pageHeight / (event.keyCode === 34 ? 1 : 10)), duration);
        break;
      // case 219: // left bracket
      //   const newRawTime = Math.round((rawTime * 3600) - timeDelta) / 3600;
      //   App.setRawTime(newRawTime, duration);
      //   break;
      // case 221: // right bracket
      //   const newRawTime = Math.round((rawTime * 3600) + timeDelta) / 3600;
      //   App.setRawTime(newRawTime, duration);
      //   break;
      case 187: // plus
        App.setZoom(compute.clampZoom(Math.round((zoom * 10) - zoomDelta) / 10), duration);
        break;
      case 189: // minus
        App.setZoom(compute.clampZoom(Math.round((zoom * 10) + zoomDelta) / 10), duration);
        break;
      default: // 1-9, 0
        if (event.keyCode >= 49 && event.keyCode <= 57 || event.keyCode === 48) {
          const newZoom = compute.clampZoom(
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
