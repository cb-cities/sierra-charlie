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
  this.prevCursor = null;
  this.prevClickDate = 0;
  window.Geometry = this.geometry = new Geometry({ // TODO
      onRoadNodesLoaded: this.onRoadNodesLoaded.bind(this),
      onRoadLinksLoaded: this.onRoadLinksLoaded.bind(this),
      onRoadsLoaded: this.onRoadsLoaded.bind(this)
    });
  window.Grid = this.grid = new Grid(); // TODO
  window.RoadNodeTree = this.roadNodeTree = new Quadtree(defs.quadtreeLeft, defs.quadtreeTop, defs.quadtreeSize, this.geometry.getPointForRoadNode.bind(this.geometry)); // TODO
  window.RoadLinkTree = this.roadLinkTree = new Polyquadtree(defs.quadtreeLeft, defs.quadtreeTop, defs.quadtreeSize, this.geometry.getBoundsForRoadLink.bind(this.geometry)); // TODO
  this.highlightedFeature = null;
  this.highlightedRoadNodeIndices = new Indexset();
  this.highlightedRoadLinkIndices = new Indexset();
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
  space.addEventListener("mouseleave", this.onMouseLeft.bind(this));
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

  sendLoadingProgress: function () {
    UI.ports.setLoadingProgress.send(this.geometry.getItemCount() / defs.maxGeometryItemCount * 100);
  },

  sendHighlightedFeature: function () {
    UI.ports.setHighlightedFeature.send(this.highlightedFeature);
  },

  sendSelectedFeature: function () {
    UI.ports.setSelectedFeature.send(this.selectedFeature);
  },

  getClosestFeature: function () { // TODO: Refactor
    const cursorP = this.fromClientPoint(this.prevCursor);
    const cursorR = this.fromClientRect(vector.bounds(10, this.prevCursor));
    const roadNodes = this.roadNodeTree.select(cursorR);
    let closestRoadNodeDistance = Infinity;
    let closestRoadNode = null;
    for (let i = 0; i < roadNodes.length; i++) {
      const p = this.geometry.getPointForRoadNode(roadNodes[i]);
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
      const ps = this.geometry.getPointsForRoadLink(roadLinks[j]);
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
        roadLink: null,
        road: null
      };
    } else if (closestRoadLink) {
      return {
        tag: "roadLink",
        roadLink: closestRoadLink,
        roadNode: null,
        road: null
      };
    } else {
      return null;
    }
  },

  highlightFeature: function (feature) { // TODO: Refactor
    if (feature !== this.highlightedFeature) {
      const gl = App.drawingContext.gl; // TODO
      this.highlightedFeature = feature;
      this.highlightedRoadNodeIndices.clear();
      this.highlightedRoadLinkIndices.clear();
      if (feature) {
        switch (feature.tag) {
          case "roadNode": {
            const pointIndex = this.geometry.getPointIndexForRoadNode(feature.roadNode);
            this.highlightedRoadNodeIndices.insertPoint(pointIndex);
            this.highlightedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
            break;
          }
          case "roadLink": {
            const pointIndices = this.geometry.getPointIndicesForRoadLink(feature.roadLink);
            this.highlightedRoadNodeIndices.insertPoints(pointIndices);
            this.highlightedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
            const lineIndices = this.geometry.getLineIndicesForRoadLink(feature.roadLink);
            this.highlightedRoadLinkIndices.insertLine(lineIndices);
            this.highlightedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
            break;
          }
          case "road": {
            const pointIndices = this.geometry.getPointIndicesForRoad(feature.road);
            this.highlightedRoadNodeIndices.insertPoints(pointIndices);
            this.highlightedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
            const lineIndices = this.geometry.getLineIndicesForRoad(feature.road);
            this.highlightedRoadLinkIndices.insertLine(lineIndices);
            this.highlightedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
            break;
          }
        }
      }
      this.sendHighlightedFeature();
      App.isDrawingNeeded = true; // TODO
    }
  },

  selectFeature: function (feature) { // TODO: Refactor
    if (feature !== this.selectedFeature) {
      const gl = App.drawingContext.gl; // TODO
      this.selectedFeature = feature;
      this.selectedRoadNodeIndices.clear();
      this.selectedRoadLinkIndices.clear();
      if (feature) {
        switch (feature.tag) {
          case "roadNode": {
            const pointIndex = this.geometry.getPointIndexForRoadNode(feature.roadNode);
            this.selectedRoadNodeIndices.insertPoint(pointIndex);
            this.selectedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
            break;
          }
          case "roadLink": {
            const pointIndices = this.geometry.getPointIndicesForRoadLink(feature.roadLink);
            this.selectedRoadNodeIndices.insertPoints(pointIndices);
            this.selectedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
            const lineIndices = this.geometry.getLineIndicesForRoadLink(feature.roadLink);
            this.selectedRoadLinkIndices.insertLine(lineIndices);
            this.selectedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
            break;
          }
          case "road": {
            const pointIndices = this.geometry.getPointIndicesForRoad(feature.road);
            this.selectedRoadNodeIndices.insertPoints(pointIndices);
            this.selectedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
            const lineIndices = this.geometry.getLineIndicesForRoad(feature.road);
            this.selectedRoadLinkIndices.insertLine(lineIndices);
            this.selectedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
            break;
          }
        }
      }
      this.sendSelectedFeature();
      App.isDrawingNeeded = true; // TODO
    }
  },

  updateHighlightedFeature: function () { // TODO: Refactor
    const gl = App.drawingContext.gl; // TODO
    const feature = this.highlightedFeature;
    if (feature) {
      switch (feature.tag) {
        case "roadLink": {
          this.highlightedRoadNodeIndices.clear();
          this.highlightedRoadLinkIndices.clear();

          const pointIndices = this.geometry.getPointIndicesForRoadLink(feature.roadLink);
          this.highlightedRoadNodeIndices.insertPoints(pointIndices);
          this.highlightedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
          const lineIndices = this.geometry.getLineIndicesForRoadLink(feature.roadLink);
          this.highlightedRoadLinkIndices.insertLine(lineIndices);
          this.highlightedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
          break;
        }
        case "road": {
          this.highlightedRoadNodeIndices.clear();
          this.highlightedRoadLinkIndices.clear();

          const pointIndices = this.geometry.getPointIndicesForRoad(feature.road);
          this.highlightedRoadNodeIndices.insertPoints(pointIndices);
          this.highlightedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
          const lineIndices = this.geometry.getLineIndicesForRoad(feature.road);
          this.highlightedRoadLinkIndices.insertLine(lineIndices);
          this.highlightedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
          break;
        }
      }
    }
  },

  updateSelectedFeature: function () { // TODO: Refactor
    const gl = App.drawingContext.gl; // TODO
    const feature = this.selectedFeature;
    if (feature) {
      switch (feature.tag) {
        case "roadLink": {
          this.selectedRoadNodeIndices.clear();
          this.selectedRoadLinkIndices.clear();

          const pointIndices = this.geometry.getPointIndicesForRoadLink(feature.roadLink);
          this.selectedRoadNodeIndices.insertPoints(pointIndices);
          this.selectedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
          const lineIndices = this.geometry.getLineIndicesForRoadLink(feature.roadLink);
          this.selectedRoadLinkIndices.insertLine(lineIndices);
          this.selectedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
          break;
        }
        case "road": {
          this.selectedRoadNodeIndices.clear();
          this.selectedRoadLinkIndices.clear();

          const pointIndices = this.geometry.getPointIndicesForRoad(feature.road);
          this.selectedRoadNodeIndices.insertPoints(pointIndices);
          this.selectedRoadNodeIndices.render(gl, gl.DYNAMIC_DRAW);
          const lineIndices = this.geometry.getLineIndicesForRoad(feature.road);
          this.selectedRoadLinkIndices.insertLine(lineIndices);
          this.selectedRoadLinkIndices.render(gl, gl.DYNAMIC_DRAW);
          break;
        }
      }
    }
  },

  highlightFeatureAtCursor: function () {
    if (this.prevCursor) {
      this.highlightFeature(this.getClosestFeature());
    }
  },

  highlightFeatureByTOID: function (toid) {
    this.highlightFeature(this.geometry.getFeatureByTOID(toid));
  },

  selectFeatureByTOID: function (toid) {
    this.selectFeature(this.geometry.getFeatureByTOID(toid));
    if (this.selectedFeature) {
      this.displayFeature(this.selectedFeature, false, false); // TODO: Pass prev shift key state
    }
  },

  onRoadNodesLoaded: function (roadNodes) {
    for (let i = 0; i < roadNodes.length; i++) {
      this.roadNodeTree.insert(roadNodes[i]);
    }
    App.updateDrawingContext(); // TODO
    this.sendLoadingProgress();
    this.updateHighlightedFeature();
    this.updateSelectedFeature();
    this.sendHighlightedFeature();
    this.sendSelectedFeature();
    this.highlightFeatureAtCursor();
  },

  onRoadLinksLoaded: function (roadLinks) {
    for (let i = 0; i < roadLinks.length; i++) {
      this.roadLinkTree.insert(roadLinks[i]);
    }
    App.updateDrawingContext(); // TODO
    this.sendLoadingProgress();
    this.updateHighlightedFeature();
    this.updateSelectedFeature();
    this.sendHighlightedFeature();
    this.sendSelectedFeature();
    this.highlightFeatureAtCursor();
  },

  onRoadsLoaded: function (roads) {
    this.sendLoadingProgress();
    this.sendHighlightedFeature();
    this.sendSelectedFeature();
  },

  onAddressesLoaded: function (addresses) {
    this.sendLoadingProgress();
    this.sendHighlightedFeature();
    this.sendSelectedFeature();
  },

  onFrameScrolled: function (event) {
    if (!(App.isScrolling())) {
      const frame = document.getElementById("map-frame");
      const zoom = App.getZoom();
      const newCenterX = compute.centerXFromScrollLeft(frame.scrollLeft, zoom);
      const newCenterY = compute.centerYFromScrollTop(frame.scrollTop, zoom);
      App.setStaticCenter(newCenterX, newCenterY);
    }
    this.highlightFeatureAtCursor();
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
    this.prevCursor = {
      x: event.clientX,
      y: event.clientY
    };
    this.highlightFeatureAtCursor();
  },

  onMouseLeft: function (event) {
    this.prevCursor = null;
    this.highlightFeature(null);
  },

  displayFeature: function (feature, doSlowMotion, doZoom, doReverseZoom) { // TODO: Refactor
    const duration = doSlowMotion ? 2500 : 500;
    switch (feature.tag) {
      case "roadNode": {
        const p = this.geometry.getPointForRoadNode(feature.roadNode);
        App.setCenter(p, duration);
        if (doZoom) { // double-click only
          const zoom = App.getZoom();
          App.setZoom(compute.clampZoom(doReverseZoom ? zoom + 1 : Math.min(zoom - 1, defs.actualZoom)), duration);
        }
        break;
      }
      case "roadLink": {
        const p = this.geometry.getMidpointForRoadLink(feature.roadLink);
        App.setCenter(p, duration);
        const clientWidth = this.getClientWidth();
        const clientHeight = this.getClientHeight();
        const zoom = App.getZoom();
        const r = this.geometry.getBoundsForRoadLink(10, feature.roadLink);
        const fittedZoom = compute.zoomForRect(r, clientWidth, clientHeight);
        let newZoom;
        if (doZoom) {
          newZoom = doReverseZoom ? zoom + 1 : Math.max(fittedZoom, Math.min(zoom - 1, defs.actualZoom));
        } else {
          newZoom = Math.max(zoom, fittedZoom);
        }
        App.setZoom(compute.clampZoom(newZoom), duration);
        break;
      }
      case "road": {
        const p = this.geometry.getMidpointForRoad(feature.road);
        App.setCenter(p, duration);
        const clientWidth = this.getClientWidth();
        const clientHeight = this.getClientHeight();
        const zoom = App.getZoom();
        const r = this.geometry.getBoundsForRoad(10, feature.road);
        const fittedZoom = compute.zoomForRect(r, clientWidth, clientHeight);
        let newZoom;
        if (doZoom) {
          newZoom = doReverseZoom ? zoom + 1 : Math.max(fittedZoom, Math.min(zoom - 1, defs.actualZoom));
        } else {
          newZoom = Math.max(zoom, fittedZoom);
        }
        App.setZoom(compute.clampZoom(newZoom), duration);
      }
    }
  },

  onMouseClicked: function (event) {
    const now = Date.now();
    const delta = now - this.prevClickDate;
    if (this.prevCursor && delta > 500) {
      this.prevClickDate = now;
      this.selectFeature(this.highlightedFeature);
      if (this.selectedFeature) {
        this.displayFeature(this.selectedFeature, !!event.shiftKey, false);
      }
    } else {
      this.prevClickDate = null;
    }
  },

  onMouseDoubleClicked: function (event) {
    if (this.prevCursor && this.selectedFeature) {
      this.displayFeature(this.selectedFeature, !!event.shiftKey, true, !!event.altKey);
    } else {
      const zoom = App.getZoom();
      const duration = event.shiftKey ? 2500 : 500;
      const newZoom = compute.clampZoom(event.altKey ? zoom + 1 : zoom - 1);
      const newCenter = compute.clampPoint(this.fromClientPoint(this.prevCursor));
      App.setZoom(newZoom, duration);
      App.setCenter(newCenter, duration);
    }
  },

  onKeyPressed: function (event) { // TODO: Refactor
    const duration = event.shiftKey ? 2500 : 500;
    switch (event.keyCode) {
      case 37: // left
      case 36: { // home
        const clientWidth = this.getClientWidth();
        const centerX = App.getStaticCenterX();
        const zoom = App.getStaticZoom();
        const pageWidth = compute.fromClientWidth(clientWidth, zoom);
        const scale = event.keyCode === 36 ? 1 : 10;
        App.setCenterX(compute.clampX(centerX - pageWidth / scale), duration);
        break;
      }
      case 39: // right
      case 35: { // end
        const clientWidth = this.getClientWidth();
        const centerX = App.getStaticCenterX();
        const zoom = App.getStaticZoom();
        const pageWidth = compute.fromClientWidth(clientWidth, zoom);
        const scale = event.keyCode === 35 ? 1 : 10;
        App.setCenterX(compute.clampX(centerX + pageWidth / scale), duration);
        break;
      }
      case 38: // up
      case 33: { // page up
        const clientHeight = this.getClientHeight();
        const centerY = App.getStaticCenterY();
        const zoom = App.getStaticZoom();
        const pageHeight = compute.fromClientHeight(clientHeight, zoom);
        const scale = event.keyCode === 33 ? 1 : 10;
        App.setCenterY(compute.clampY(centerY + pageHeight / scale), duration);
        break;
      }
      case 40: // down
      case 34: { // page down
        const clientHeight = this.getClientHeight();
        const centerY = App.getStaticCenterY();
        const zoom = App.getStaticZoom();
        const pageHeight = compute.fromClientHeight(clientHeight, zoom);
        const scale = event.keyCode === 34 ? 1 : 10;
        App.setCenterY(compute.clampY(centerY - pageHeight / scale), duration);
        break;
      }
      // case 219: // left bracket
      //   const rawTime = App.getStaticRawTime();
      //   const timeDelta = event.altKey ? 60 : 3600;
      //   const newRawTime = Math.round((rawTime * 3600) - timeDelta) / 3600;
      //   App.setRawTime(newRawTime, duration);
      //   break;
      // case 221: // right bracket
      //   const rawTime = App.getStaticRawTime();
      //   const timeDelta = event.altKey ? 60 : 3600;
      //   const newRawTime = Math.round((rawTime * 3600) + timeDelta) / 3600;
      //   App.setRawTime(newRawTime, duration);
      //   break;
      case 187: { // plus
        const zoom = App.getStaticZoom();
        const zoomDelta = event.altKey ? 2 : 10; // TODO
        const newZoom = compute.clampZoom(Math.round((zoom * 10) - zoomDelta) / 10);
        App.setZoom(newZoom, duration);
        break;
      }
      case 189: { // minus
        const zoom = App.getStaticZoom();
        const zoomDelta = event.altKey ? 2 : 10; // TODO
        const newZoom = compute.clampZoom(Math.round((zoom * 10) + zoomDelta) / 10);
        App.setZoom(newZoom, duration);
        break;
      }
      case 48: { // 0
        const newZoom = compute.clampZoom(10);
        App.setZoom(newZoom, duration);
        break;
      }
      default: { // 1-9, 0
        if (event.keyCode >= 49 && event.keyCode <= 57) {
          const newZoom = compute.clampZoom(event.keyCode - 49);
          App.setZoom(newZoom, duration);
        }
      }
    }
  },

  onWindowResized: function () {
    App.isDrawingNeeded = true; // TODO
  }
};

module.exports = Controller;
