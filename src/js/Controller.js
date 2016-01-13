"use strict";

const Adjustment = require("./Adjustment");
const Geometry = require("./Geometry");
const Grid = require("./Grid");
const Indexset = require("./Indexset");
const Polyquadtree = require("./Polyquadtree");
const Quadtree = require("./Quadtree");

const compute = require("./compute");
const defs = require("./defs");
const polyline = require("./lib/polyline");
const vector = require("./lib/vector");


function Controller() {
  this.mode = null;
  this.prevCursor = null;
  this.prevClickDate = 0;
  window.Geometry = this.geometry = new Geometry({ // TODO
      onRoadNodesLoaded: this.onRoadNodesLoaded.bind(this),
      onRoadLinksLoaded: this.onRoadLinksLoaded.bind(this),
      onRoadsLoaded: this.onRoadsLoaded.bind(this)
    });
  window.Grid = this.grid = new Grid(); // TODO
  window.RoadNodeTree = this.roadNodeTree = new Quadtree(defs.quadtreeLeft, defs.quadtreeTop, defs.quadtreeSize); // TODO
  window.RoadLinkTree = this.roadLinkTree = new Polyquadtree(defs.quadtreeLeft, defs.quadtreeTop, defs.quadtreeSize); // TODO
  this.highlightedFeature = null;
  this.highlightedPointIndices = new Indexset();
  this.highlightedLineIndices = new Indexset();
  this.selectedFeature = null;
  this.selectedPointIndices = new Indexset();
  this.selectedLineIndices = new Indexset();
  this.adjustment = new Adjustment();
  this.deletedPointIndices = new Indexset();
  this.deletedLineIndices = new Indexset();
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

  exportRoadNode: function (roadNode) {
    return !roadNode ? null : {
      toid: roadNode.toid,
      address: roadNode.address,
      roadLinkTOIDs: roadNode.roadLinks.map(function (roadLink) {
          return roadLink.toid;
        }),
      isDeleted: this.adjustment.isRoadNodeDeleted(roadNode),
      isUndeletable: this.adjustment.isRoadNodeUndeletable(roadNode)
    };
  },

  exportRoadLink: function (roadLink) {
    return !roadLink ? null : {
      toid: roadLink.toid,
      term: roadLink.term,
      nature: roadLink.nature,
      negativeNodeTOID: !roadLink.negativeNode ? null : roadLink.negativeNode.toid,
      positiveNodeTOID: !roadLink.positiveNode ? null : roadLink.positiveNode.toid,
      roads: roadLink.roads.map(this.exportRoad.bind(this)),
      isDeleted: this.adjustment.isRoadLinkDeleted(roadLink),
      isUndeletable: this.adjustment.isRoadLinkUndeletable(roadLink)
    };
  },

  exportRoad: function (road) {
    return !road ? null : {
      toid: road.toid,
      group: road.group,
      term: road.term,
      name: road.name,
      roadLinkTOIDs: road.roadLinks.map(function (roadLink) {
          return roadLink.toid;
        }),
      isDeleted: this.adjustment.isRoadDeleted(road)
    };
  },

  exportRoute: function (route) {
    return !route ? null : {
      startNodeTOID: route.startNode.toid,
      endNodeTOID: route.endNode.toid,
      roadLinkTOIDs: route.roadLinks.map(function (roadLink) {
          return roadLink.toid;
        })
    };
  },

  exportFeature: function (feature) {
    return !feature ? null : {
      tag: feature.tag,
      roadNode: this.exportRoadNode(feature.roadNode),
      roadLink: this.exportRoadLink(feature.roadLink),
      road: this.exportRoad(feature.road),
      route: this.exportRoute(feature.route)
    };
  },

  sendMode: function () {
    UI.ports.mode.send(this.mode);
  },

  sendLoadingProgress: function () {
    const loadingProgress = this.geometry.getItemCount() / defs.maxGeometryItemCount * 100;
    UI.ports.loadingProgress.send(loadingProgress);
  },

  sendHighlightedFeature: function () {
    UI.ports.highlightedFeature.send(this.exportFeature(this.highlightedFeature));
  },

  sendSelectedFeature: function () {
    UI.ports.selectedFeature.send(this.exportFeature(this.selectedFeature));
  },

  setMode: function (mode) {
    this.mode = mode;
    this.sendMode();
  },

  findClosestRoadNode: function () { // TODO: Refactor
    const cursorP = this.fromClientPoint(this.prevCursor);
    const cursorR = this.fromClientRect(vector.bounds(10, this.prevCursor));
    let closestRoadNodeDistance = Infinity;
    let closestRoadNode = null;
    const roadNodes = this.roadNodeTree.select(cursorR);
    for (let i = 0; i < roadNodes.length; i++) {
      const p = this.geometry.getPointForRoadNode(roadNodes[i]);
      const d1 = vector.distance(cursorP, p);
      if (d1 < closestRoadNodeDistance) {
        closestRoadNodeDistance = d1;
        closestRoadNode = roadNodes[i];
      }
    }
    return closestRoadNode;
  },

  findClosestFeature: function () { // TODO: Refactor
    const cursorP = this.fromClientPoint(this.prevCursor);
    const cursorR = this.fromClientRect(vector.bounds(10, this.prevCursor));
    let closestRoadNodeDistance = Infinity;
    let closestRoadNode = null;
    const roadNodes = this.roadNodeTree.select(cursorR);
    for (let i = 0; i < roadNodes.length; i++) {
      const p = this.geometry.getPointForRoadNode(roadNodes[i]);
      const d1 = vector.distance(cursorP, p);
      if (d1 < closestRoadNodeDistance) {
        closestRoadNodeDistance = d1;
        closestRoadNode = roadNodes[i];
      }
    }
    let closestRoadLinkDistance = Infinity;
    let closestRoadLink = null;
    const roadLinks = this.roadLinkTree.select(cursorR);
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
        roadNode: closestRoadNode
      };
    } else if (closestRoadLink) {
      return {
        tag: "roadLink",
        roadLink: closestRoadLink
      };
    } else {
      return null;
    }
  },

  renderFeature: function (feature, pointIndices, lineIndices) {
    if (feature) {
      const gl = App.drawingContext.gl; // TODO
      switch (feature.tag) {
        case "roadNode": {
          pointIndices.insert([this.geometry.getPointIndexForRoadNode(feature.roadNode)]);
          pointIndices.render(gl, gl.DYNAMIC_DRAW);
          break;
        }
        case "roadLink": {
          pointIndices.insert(this.geometry.getPointIndicesForRoadLink(feature.roadLink));
          pointIndices.render(gl, gl.DYNAMIC_DRAW);
          lineIndices.insert(this.geometry.getLineIndicesForRoadLink(feature.roadLink));
          lineIndices.render(gl, gl.DYNAMIC_DRAW);
          break;
        }
        case "road":
        case "route": {
          const roadLinks =
            feature.tag === "road" ?
              feature.road.roadLinks :
              feature.route.roadLinks;
          pointIndices.insert(this.geometry.getPointIndicesForRoadLinks(roadLinks));
          pointIndices.render(gl, gl.DYNAMIC_DRAW);
          lineIndices.insert(this.geometry.getLineIndicesForRoadLinks(roadLinks));
          lineIndices.render(gl, gl.DYNAMIC_DRAW);
          break;
        }
      }
    }
    App.isDrawingNeeded = true; // TODO
  },

  renderHighlightedFeature: function () {
    this.highlightedPointIndices.clear();
    this.highlightedLineIndices.clear();
    this.renderFeature(this.highlightedFeature, this.highlightedPointIndices, this.highlightedLineIndices);
  },

  renderSelectedFeature: function () {
    this.selectedPointIndices.clear();
    this.selectedLineIndices.clear();
    this.renderFeature(this.selectedFeature, this.selectedPointIndices, this.selectedLineIndices);
  },

  renderDeletedFeatures: function () { // TODO
    this.deletedPointIndices.clear();
    this.deletedLineIndices.clear();
    const toids = Object.keys(this.adjustment.deletedFeatures);
    for (let i = 0; i < toids.length; i++) {
      const feature = this.adjustment.deletedFeatures[toids[i]];
      this.renderFeature(feature, this.deletedPointIndices, this.deletedLineIndices);
    }
  },

  highlightFeature: function (feature) {
    if (feature !== this.highlightedFeature) {
      this.highlightedFeature = feature;
      this.renderHighlightedFeature();
      this.sendHighlightedFeature();
    }
  },

  selectFeature: function (feature) {
    if (feature !== this.selectedFeature) {
      this.selectedFeature = feature;
      this.renderSelectedFeature();
      this.sendSelectedFeature();
    }
  },

  highlightFeatureAtCursor: function () {
    if (this.prevCursor) {
      switch (this.mode) {
        case "routing":
          // TODO
          const roadNode = this.findClosestRoadNode();
          if (roadNode && !(this.adjustment.isRoadNodeDeleted(roadNode))) {
            const route = this.geometry.findShortestRouteBetweenRoadNodes(this.selectedFeature.roadNode, roadNode, this.adjustment);
            if (route) {
              this.highlightFeature(route);
            }
          } else {
            this.highlightFeature(null);
          }
          break;
        default: {
          this.highlightFeature(this.findClosestFeature());
        }
      }
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

  deleteSelectedFeature: function () {
    if (this.selectedFeature) {
      this.adjustment.deleteFeature(this.selectedFeature);
      this.renderDeletedFeatures();
      this.selectFeature(null);
    }
  },

  undeleteSelectedFeature: function () {
    if (this.selectedFeature) {
      this.adjustment.undeleteFeature(this.selectedFeature);
      this.renderDeletedFeatures();
      this.selectFeature(null);
    }
  },

  onRoadNodesLoaded: function (roadNodes) {
    for (let i = 0; i < roadNodes.length; i++) {
      this.roadNodeTree.insert(roadNodes[i]);
    }
    App.renderContents(); // TODO
    this.sendLoadingProgress();
    this.renderHighlightedFeature();
    this.renderSelectedFeature();
    this.sendHighlightedFeature();
    this.sendSelectedFeature();
    this.highlightFeatureAtCursor();
  },

  onRoadLinksLoaded: function (roadLinks) {
    for (let i = 0; i < roadLinks.length; i++) {
      this.roadLinkTree.insert(roadLinks[i]);
    }
    App.renderContents(); // TODO
    this.sendLoadingProgress();
    this.renderHighlightedFeature();
    this.renderSelectedFeature();
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
    this.prevCursor = [
      event.clientX,
      event.clientY
    ];
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
      case "road":
      case "route": {
        const roadLinks =
          feature.tag === "road" ?
            feature.road.roadLinks :
            feature.route.roadLinks;
        const p = this.geometry.getMidpointForRoadLinks(roadLinks);
        App.setCenter(p, duration);
        const clientWidth = this.getClientWidth();
        const clientHeight = this.getClientHeight();
        const zoom = App.getZoom();
        const r = this.geometry.getBoundsForRoadLinks(10, roadLinks);
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
      switch (this.mode) {
        case "routing":
          // TODO
          this.setMode(null);
          if (this.highlightedFeature) {
            this.selectFeature(this.highlightedFeature);
            if (this.selectedFeature) {
              this.displayFeature(this.selectedFeature, !!event.shiftKey, false);
            }
          }
          break;
        default: {
          this.selectFeature(this.highlightedFeature);
          if (this.selectedFeature) {
            this.displayFeature(this.selectedFeature, !!event.shiftKey, false);
          }
        }
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
      case 27: { // escape
        this.setMode(null);
        break;
      }
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
