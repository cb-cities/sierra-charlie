"use strict";

const googlePolyline = require("polyline");
const nnng = require("nnng");

const Adjustment = require("./Adjustment");
const Geometry = require("./Geometry");
const Google = require("./Google");
const Grid = require("./Grid");
const Lineset = require("./Lineset");
const Indexset = require("./Indexset");
const Pointset = require("./Pointset");
const Polyquadtree = require("./Polyquadtree");
const Quadtree = require("./Quadtree");

const compute = require("./compute");
const defs = require("./defs");
const polyline = require("./lib/polyline");
const rect = require("./lib/rect");
const segment = require("./lib/segment");
const url = require("./lib/url");
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
  window.Google = this.google = new Google({
      onRouteReceived: this.onRouteReceived.bind(this)
    }); // TODO
  this.grid = new Grid(); // TODO
  this.roadNodeTree = new Quadtree(defs.quadtreeLeft, defs.quadtreeTop, defs.quadtreeSize); // TODO
  this.roadLinkTree = new Polyquadtree(defs.quadtreeLeft, defs.quadtreeTop, defs.quadtreeSize); // TODO
  this.modeLines = new Lineset();
  this.highlightedFeature = null;
  this.highlightedPoints = new Pointset();
  this.highlightedLines = new Lineset();
  this.highlightedPointIndices = new Indexset();
  this.highlightedLineIndices = new Indexset();
  this.selectedFeature = null;
  this.selectedPoints = new Pointset();
  this.selectedLines = new Lineset();
  this.selectedPointIndices = new Indexset();
  this.selectedLineIndices = new Indexset();
  this.routingFeatures = {};
  this.routingPoints = new Pointset();
  this.routingLines = new Lineset();
  this.routingPointIndices = new Indexset();
  this.routingLineIndices = new Indexset();
  this.adjustment = new Adjustment();
  this.deletedPointIndices = new Indexset();
  this.deletedLineIndices = new Indexset();
  const frame = document.getElementById("map-frame");
  const canvas = document.getElementById("map-canvas");
  const space = document.getElementById("map-space");
  frame.addEventListener("scroll", this.onFrameScrolled.bind(this));
  canvas.addEventListener("webglcontextlost", this.onCanvasContextLost.bind(this));
  canvas.addEventListener("webglcontextrestored", this.onCanvasContextRestored.bind(this));
  space.addEventListener("mousemove", this.onMouseMoved.bind(this));
  space.addEventListener("mouseleave", this.onMouseLeft.bind(this));
  space.addEventListener("click", this.onMouseClicked.bind(this));
  space.addEventListener("dblclick", this.onMouseDoubleClicked.bind(this));
  space.addEventListener("mousewheel", this.onMouseWheeled.bind(this));
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
      point: roadNode.point,
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
      length: roadLink.length,
      penalty: roadLink.penalty,
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
      toid: route.toid,
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
    UI.updateMode(this.mode || null);
  },

  sendLoadingProgress: function () {
    const loadingProgress = this.geometry.getItemCount() / defs.maxGeometryItemCount * 100;
    UI.updateLoadingProgress(loadingProgress);
  },

  sendHighlightedFeature: function () {
    UI.updateHighlightedFeature(this.exportFeature(this.highlightedFeature));
  },

  sendSelectedFeature: function () {
    UI.updateSelectedFeature(this.exportFeature(this.selectedFeature));
  },

  sendRoutes: function () {
    const routingTOIDs = Object.keys(this.routingFeatures);
    const routes = [];
    for (let i = 0; i < routingTOIDs.length; i++) {
      const feature = this.routingFeatures[routingTOIDs[i]];
      routes.push(this.exportRoute(feature.route));
    }
    UI.updateRoutes(routes);
  },

  sendAdjustment: function () {
    UI.updateAdjustment(this.adjustment.dump());
  },

  saveRoutesAsJSON: function () { // TODO: Refactor
    const routingTOIDs = Object.keys(this.routingFeatures);
    const routes = [];
    for (let i = 0; i < routingTOIDs.length; i++) {
      const feature = this.routingFeatures[routingTOIDs[i]];
      routes.push(this.exportRoute(feature.route));
    }
    open(url.encodeJSONAsBlob(routes));
  },

  saveAdjustmentAsJSON: function () { // TODO: Refactor
    open(url.encodeJSONAsBlob(this.adjustment.dump()));
  },

  setMode: function (mode) {
    this.mode = mode;
    if (!this.mode) {
      this.modeLines.clear();
      App.isDrawingNeeded = true; // TODO
    }
    this.sendMode();
  },

  findClosestRoadNodeToPoint: function (p, r) {
    let closestRoadNodeDistance = Infinity;
    let closestRoadNode = null;
    const roadNodes = this.roadNodeTree.select(r);
    for (let i = 0; i < roadNodes.length; i++) {
      const node = roadNodes[i];
      if (window.ViewManager.isNodeVisible(node) && window.ModelManager.isNodeVisible(node)) {
        const d1 = vector.distance(p, node.point);
        if (d1 < closestRoadNodeDistance) {
          closestRoadNodeDistance = d1;
          closestRoadNode = node;
        }
      }
    }
    return closestRoadNode;
  },

  findClosestFeatureToPoint: function (p, r) { // TODO: Refactor
    let closestRoadNodeDistance = Infinity;
    let closestRoadNode = null;
    const roadNodes = this.roadNodeTree.select(r);
    for (let i = 0; i < roadNodes.length; i++) {
      const node = roadNodes[i];
      if (window.ViewManager.isNodeVisible(node) && window.ModelManager.isNodeVisible(node)) {
        const d1 = vector.distance(p, node.point);
        if (d1 < closestRoadNodeDistance) {
          closestRoadNodeDistance = d1;
          closestRoadNode = node;
        }
      }
    }
    let closestRoadLinkDistance = Infinity;
    let closestRoadLink = null;
    const roadLinks = this.roadLinkTree.select(r);
    for (let j = 0; j < roadLinks.length; j++) {
      const link = roadLinks[j];
      if (window.ViewManager.isLinkVisible(link) && window.ModelManager.isLinkVisible(link)) {
        const ps = this.geometry.getPointsForRoadLink(link);
        const d2 = polyline.distance(p, ps);
        if (d2 < closestRoadLinkDistance) {
          closestRoadLinkDistance = d2;
          closestRoadLink = link;
        }
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

  findClosestRoadNodeToCursor: function () { // TODO: Refactor
    const p = this.fromClientPoint(this.prevCursor);
    const r = this.fromClientRect(vector.bounds(10, this.prevCursor));
    return this.findClosestRoadNodeToPoint(p, r);
  },

  findClosestFeatureToCursor: function () { // TODO: Refactor
    const p = this.fromClientPoint(this.prevCursor);
    const r = this.fromClientRect(vector.bounds(10, this.prevCursor));
    return this.findClosestFeatureToPoint(p, r);
  },

  renderFeature: function (feature, pointIndices, lineIndices) {
    if (feature) {
      const gl = App.drawingContext.gl; // TODO
      this.geometry.bindVertexBuffer(gl);
      switch (feature.tag) {
        case "roadNode":
          pointIndices.insert([this.geometry.getPointIndexForRoadNode(feature.roadNode)]);
          pointIndices.render(gl, gl.DYNAMIC_DRAW);
          break;
        case "roadLink":
          pointIndices.insert(this.geometry.getPointIndicesForRoadLink(feature.roadLink));
          lineIndices.insert(this.geometry.getLineIndicesForRoadLink(feature.roadLink));
          pointIndices.render(gl, gl.DYNAMIC_DRAW);
          lineIndices.render(gl, gl.DYNAMIC_DRAW);
          break;
        case "road": {
          const roadLinks = feature.road.roadLinks;
          pointIndices.insert(this.geometry.getPointIndicesForRoadLinks(roadLinks));
          lineIndices.insert(this.geometry.getLineIndicesForRoadLinks(roadLinks));
          pointIndices.render(gl, gl.DYNAMIC_DRAW);
          lineIndices.render(gl, gl.DYNAMIC_DRAW);
          break;
        }
        case "route": {
          const route = feature.route;
          const roadLinks = route.roadLinks;
          const ps = route.importedPoints;
          if (roadLinks.length) {
            pointIndices.insert(this.geometry.getPointIndicesForRoadLinks(roadLinks));
            lineIndices.insert(this.geometry.getLineIndicesForRoadLinks(roadLinks));
          } else {
            pointIndices.insert([
                this.geometry.getPointIndexForRoadNode(route.startNode),
                this.geometry.getPointIndexForRoadNode(route.endNode)
              ]);
            if (!ps || !ps.length) {
              this.routingPoints.insertPoint(route.startNode.point);
              this.routingPoints.insertPoint(route.endNode.point);
              this.routingLines.insertLine(route.startNode.point, route.endNode.point);
            }
          }
          if (ps) {
            for (let i = 0; i < ps.length; i++) {
              this.routingPoints.insertPoint(ps[i]);
            }
            for (let i = 0; i < ps.length - 1; i++) {
              this.routingLines.insertLine(ps[i], ps[i + 1]);
            }
          }
          pointIndices.render(gl, gl.DYNAMIC_DRAW);
          lineIndices.render(gl, gl.DYNAMIC_DRAW);
          this.routingPoints.render(gl, gl.DYNAMIC_DRAW);
          this.routingLines.render(gl, gl.DYNAMIC_DRAW);
          break;
        }
      }
    }
    App.isDrawingNeeded = true; // TODO
  },

  renderHighlightedFeature: function () {
    this.highlightedPoints.clear();
    this.highlightedLines.clear();
    this.highlightedPointIndices.clear();
    this.highlightedLineIndices.clear();
    this.renderFeature(
      this.highlightedFeature,
      this.highlightedPointIndices,
      this.highlightedLineIndices);
  },

  renderSelectedFeature: function () {
    this.selectedPoints.clear();
    this.selectedLines.clear();
    this.selectedPointIndices.clear();
    this.selectedLineIndices.clear();
    this.renderFeature(
      this.selectedFeature,
      this.selectedPointIndices,
      this.selectedLineIndices);
  },

  renderRoutingFeatures: function () {
    this.routingPoints.clear();
    this.routingLines.clear();
    this.routingPointIndices.clear();
    this.routingLineIndices.clear();
    const routingTOIDs = Object.keys(this.routingFeatures);
    for (let i = 0; i < routingTOIDs.length; i++) {
      const feature = this.routingFeatures[routingTOIDs[i]];
      this.renderFeature( // TODO: Remove repeated render calls inside renderFeature
        feature,
        this.routingPointIndices,
        this.routingLineIndices);
    }
  },

  renderDeletedFeatures: function () {
    this.deletedPointIndices.clear();
    this.deletedLineIndices.clear();
    const deletedTOIDs = this.adjustment.getDeletedTOIDs();
    for (let i = 0; i < deletedTOIDs.length; i++) {
      const feature = this.adjustment.getDeletedFeature(deletedTOIDs[i]);
      this.renderFeature(
        feature,
        this.deletedPointIndices,
        this.deletedLineIndices);
    }
  },

  renderModeLines: function () {
    const gl = App.drawingContext.gl; // TODO
    const cursorP = this.fromClientPoint(this.prevCursor);
    this.modeLines.clear();
    this.modeLines.insertLine(this.selectedFeature.roadNode.point, cursorP);
    this.modeLines.render(gl, gl.DYNAMIC_DRAW);
    App.isDrawingNeeded = true; // TODO;
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
      this.setMode(null);
      this.selectedFeature = feature;
      this.renderSelectedFeature();
      this.sendSelectedFeature();
      if (this.selectedFeature) {
        this.displayFeature(this.selectedFeature, false, false);
      }
    }
  },

  highlightFeatureByTOID: function (toid) {
    const feature = this.geometry.getFeatureByTOID(toid) || this.routingFeatures[toid];
    this.highlightFeature(feature);
  },

  selectFeatureByTOID: function (toid) {
    const feature = this.geometry.getFeatureByTOID(toid) || this.routingFeatures[toid];
    this.selectFeature(feature);
  },

  deleteSelectedFeature: function () {
    if (this.selectedFeature) {
      const feature = this.selectedFeature;
      this.selectFeature(null);
      if (feature.tag === "route" && feature.route.toid in this.routingFeatures) {
        delete this.routingFeatures[feature.route.toid];
        this.renderRoutingFeatures();
        this.sendRoutes();
      } else {
        this.adjustment.deleteFeature(feature);
        this.renderDeletedFeatures();
        this.sendAdjustment();
      }
      if (this.highlightedFeature === feature) {
        this.highlightFeature(null);
      } else {
        this.sendHighlightedFeature();
      }
    }
  },

  undeleteSelectedFeature: function () {
    if (this.selectedFeature) {
      this.adjustment.undeleteFeature(this.selectedFeature);
      this.renderDeletedFeatures();
      this.sendHighlightedFeature();
      this.sendSelectedFeature();
      this.sendAdjustment();
    }
  },

  clearRoutes: function () {
    this.routingFeatures = {};
    this.renderRoutingFeatures();
    if (this.highlightedFeature && this.highlightedFeature.tag === "route") {
      this.highlightFeature(null);
    }
    if (this.selectedFeature && this.selectedFeature.tag === "route") {
      this.selectFeature(null);
    }
    this.sendRoutes();
  },

  clearAdjustment: function () {
    this.adjustment.clear();
    this.renderDeletedFeatures();
    this.sendHighlightedFeature();
    this.sendSelectedFeature();
    this.sendAdjustment();
  },

  onRoadNodesLoaded: function (roadNodes) {
    for (let i = 0; i < roadNodes.length; i++) {
      this.roadNodeTree.insert(roadNodes[i]);
    }
    window.ViewManager.includeNodes(roadNodes); // FIXME
    window.ModelManager.includeNodes(roadNodes); // FIXME
    App.renderContents(); // TODO
    this.sendLoadingProgress();
    if (this.highlightedFeature) {
      this.renderHighlightedFeature();
      this.sendHighlightedFeature();
    }
    if (this.selectedFeature) {
      this.renderSelectedFeature();
      this.sendSelectedFeature();
    }
    this.highlightFeatureAtCursor();
  },

  onRoadLinksLoaded: function (roadLinks) {
    for (let i = 0; i < roadLinks.length; i++) {
      this.roadLinkTree.insert(roadLinks[i]);
    }
    window.ViewManager.includeLinks(roadLinks); // FIXME
    window.ModelManager.includeLinks(roadLinks); // FIXME
    App.renderContents(); // TODO
    this.sendLoadingProgress();
    if (this.highlightedFeature) {
      this.renderHighlightedFeature();
      this.sendHighlightedFeature();
    }
    if (this.selectedFeature) {
      this.renderSelectedFeature();
      this.sendSelectedFeature();
    }
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
    if (!this.appHasStarted) {
      this.appHasStarted = true;
    } else if (App.isScrolling()) {
      this.appWasScrolling = true;
    } else if (this.appWasScrolling) {
      this.appWasScrolling = false;
    } else {
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
    const duration = doSlowMotion ? 5000 : 500;
    switch (feature.tag) {
      case "roadNode": {
        const p = feature.roadNode.point;
        if (doZoom) { // double-click only
          const zoom = App.getZoom();
          App.adaptiveSetCenterAndZoom(p, compute.clampZoom(doReverseZoom ? zoom + 1 : Math.min(zoom - 1, defs.actualZoom)), duration);
        } else {
          App.adaptiveSetCenter(p, duration);
        }
        break;
      }
      case "roadLink": {
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
        App.adaptiveSetCenterAndZoom(rect.midpoint(r), compute.clampZoom(newZoom), duration);
        break;
      }
      case "road":
      case "route": {
        const clientWidth = this.getClientWidth();
        const clientHeight = this.getClientHeight();
        const zoom = App.getZoom();
        const roadLinks =
          feature.tag === "road" ?
            feature.road.roadLinks :
            feature.route.roadLinks;
        const r =
          feature.tag === "road" || feature.tag === "route" && feature.route.roadLinks.length ?
            this.geometry.getBoundsForRoadLinks(10, roadLinks) :
            segment.bounds(10, [
              feature.route.startNode.point,
              feature.route.endNode.point
            ]);
        const fittedZoom = compute.zoomForRect(r, clientWidth, clientHeight);
        let newZoom;
        if (doZoom) {
          newZoom = doReverseZoom ? zoom + 1 : Math.max(fittedZoom, Math.min(zoom - 1, defs.actualZoom));
        } else {
          newZoom = Math.max(zoom, fittedZoom);
        }
        App.adaptiveSetCenterAndZoom(rect.midpoint(r), compute.clampZoom(newZoom), duration);
      }
    }
  },

  highlightFeatureAtCursor: function () {
    if (this.prevCursor) {
      switch (this.mode) {
        case "GetRoute": // TODO
        case "GetRouteFromGoogle":
          const roadNode = this.findClosestRoadNodeToCursor();
          if (roadNode && !(this.adjustment.isRoadNodeDeleted(roadNode))) {
            this.highlightFeature({
                tag: "roadNode",
                roadNode: roadNode
              });
          } else {
            this.highlightFeature(null);
          }
          this.renderModeLines();
          break;
        default:
          this.highlightFeature(this.findClosestFeatureToCursor());
      }
    }
  },

  onMouseClicked: function (event) {
    const now = Date.now();
    const delta = now - this.prevClickDate;
    if (this.prevCursor && delta > 500) {
      this.prevClickDate = now;
      switch (this.mode) {
        case "GetRoute": // TODO
          this.setMode(null);
          if (this.highlightedFeature) {
            const route =
              this.geometry.findShortestRouteBetweenRoadNodes(
                this.selectedFeature.roadNode,
                this.highlightedFeature.roadNode,
                this.adjustment.isEmpty() ? null : this.adjustment);
            this.routingFeatures[route.toid] = {
              tag: "route",
              route: route
            };
            this.renderRoutingFeatures();
            this.sendRoutes();
          }
          break;
        case "GetRouteFromGoogle": // TODO
          this.setMode(null);
          if (this.highlightedFeature) {
            const route = {
              toid: "route" + Date.now(),
              startNode: this.selectedFeature.roadNode,
              endNode: this.highlightedFeature.roadNode,
              roadLinks: []
            };
            this.google.requestRoute(route.toid, route.startNode.point, route.endNode.point);
            this.routingFeatures[route.toid] = {
              tag: "route",
              route: route
            };
            this.renderRoutingFeatures();
            this.sendRoutes();
          }
          break;
        default:
          this.selectFeature(this.highlightedFeature);
      }
    } else {
      this.prevClickDate = null;
    }
  },

  findCloseRoadNodesToSegment: function (distance, s) {
    const r = segment.bounds(distance, s);
    const results = [];
    const roadNodes = this.roadNodeTree.select(r);
    for (let i = 0; i < roadNodes.length; i++) {
      const d = segment.distance(roadNodes[i].point, s);
      if (d <= distance && results.indexOf(roadNodes[i]) === -1) { // TODO
        results.push(roadNodes[i]);
      }
    }
    return results;
  },

  findCloseRoadNodesToPolyline: function (distance, ps) {
    const results = [];
    for (let i = 0; i < ps.length - 1; i++) {
      const s = [ps[i], ps[i + 1]];
      const roadNodes = this.findCloseRoadNodesToSegment(distance, s);
      for (let j = 0; j < roadNodes.length; j++) {
        if (results.indexOf(roadNodes[j]) === -1) { // TODO
          results.push(roadNodes[j]);
        }
      }
    }
    return results;
  },

  onRouteReceived: function (toid, response) { // TODO: Refactor
    if (toid in this.routingFeatures) {
      if (response.status === "OK" && response.routes && response.routes.length) {
        const googleRoute = response.routes[0];
        const googlePs = googlePolyline.decode(googleRoute.overview_polyline.points);
        const ps = [];
        for (let i = 0; i < googlePs.length; i++) {
          const latLon = googlePs[i];
          ps.push(nnng.to(latLon[0], latLon[1]));
        }
        const route = this.routingFeatures[toid].route;
        route.importedPoints = ps;
        const whiteList = this.findCloseRoadNodesToPolyline(10, ps);
        let firstNode, lastNode;
        let firstDistance = Infinity;
        let lastDistance = Infinity;
        for (let i = 0; i < whiteList.length; i++) {
          const current = whiteList[i];
          const startDistance = this.geometry.getDistanceBetweenRoadNodes(route.startNode, current);
          const endDistance = this.geometry.getDistanceBetweenRoadNodes(current, route.endNode);
          if (startDistance < firstDistance) {
            firstDistance = startDistance;
            firstNode = current;
          }
          if (endDistance < lastDistance) {
            lastDistance = endDistance;
            lastNode = current;
          }
        }
        if (firstNode && lastNode) {
          const importedRoute = this.geometry.findShortestRouteBetweenRoadNodes(firstNode, lastNode, null, whiteList);
          if (importedRoute && importedRoute.roadLinks.length) {
            route.roadLinks = importedRoute.roadLinks;
          } else {
            console.log("Could not determine importedRoute", firstNode, lastNode, importedRoute); // TODO
          }
        } else {
          console.log("Could not determine firstNode or lastNode", firstNode, lastNode, whiteList); // TODO
        }
        this.renderRoutingFeatures();
        this.sendRoutes();
      } else {
        console.log("Google failed:", toid, response); // TODO
      }
    } else {
      console.log("Google was late:", toid, response); // TODO
    }
  },

  onMouseDoubleClicked: function (event) {
    if (this.prevCursor && this.selectedFeature) {
      this.displayFeature(this.selectedFeature, !!event.shiftKey, true, !!event.altKey);
    } else {
      const zoom = App.getZoom();
      const duration = event.shiftKey ? 5000 : 500;
      const newZoom = compute.clampZoom(event.altKey ? zoom + 1 : zoom - 1);
      const newCenter = compute.clampPoint(this.fromClientPoint(this.prevCursor));
      App.adaptiveSetCenterAndZoom(newCenter, newZoom, duration);
    }
  },

  onMouseWheeled: function (event) {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  },

  onKeyPressed: function (event) { // TODO: Refactor
    const duration = event.shiftKey ? 5000 : 500;
    switch (event.keyCode) {
      case 8: { // backspace
        event.preventDefault();
        if (this.selectedFeature) {
          if (this.adjustment.isFeatureUndeletable(this.selectedFeature)) {
            this.undeleteSelectedFeature();
          } else {
            this.deleteSelectedFeature();
          }
        }
        break;
      }
      case 27: { // escape
        if (this.mode) {
          this.setMode(null);
        } else if (this.selectedFeature) {
          this.selectFeature(null);
        }
        break;
      }
      case 37: // left
      case 36: { // home
        const clientWidth = this.getClientWidth();
        const centerX = App.getStaticCenterX();
        const zoom = App.getStaticZoom();
        const pageWidth = compute.fromClientSize(clientWidth, zoom);
        const scale = event.keyCode === 36 ? 1 : 10;
        App.adaptiveSetCenterX(compute.clampX(centerX - pageWidth / scale), duration);
        break;
      }
      case 39: // right
      case 35: { // end
        const clientWidth = this.getClientWidth();
        const centerX = App.getStaticCenterX();
        const zoom = App.getStaticZoom();
        const pageWidth = compute.fromClientSize(clientWidth, zoom);
        const scale = event.keyCode === 35 ? 1 : 10;
        App.adaptiveSetCenterX(compute.clampX(centerX + pageWidth / scale), duration);
        break;
      }
      case 38: // up
      case 33: { // page up
        const clientHeight = this.getClientHeight();
        const centerY = App.getStaticCenterY();
        const zoom = App.getStaticZoom();
        const pageHeight = compute.fromClientSize(clientHeight, zoom);
        const scale = event.keyCode === 33 ? 1 : 10;
        App.adaptiveSetCenterY(compute.clampY(centerY + pageHeight / scale), duration);
        break;
      }
      case 40: // down
      case 34: { // page down
        const clientHeight = this.getClientHeight();
        const centerY = App.getStaticCenterY();
        const zoom = App.getStaticZoom();
        const pageHeight = compute.fromClientSize(clientHeight, zoom);
        const scale = event.keyCode === 34 ? 1 : 10;
        App.adaptiveSetCenterY(compute.clampY(centerY - pageHeight / scale), duration);
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
      case 219: {
        const name = window.ModelManager._activeModel._name; // FIXME
        if (name.indexOf(":") === -1) {
          window.ModelManager.setActiveModel("00:00");
        } else {
          const tokens = name.split(":");
          let hour = parseInt(tokens[0]);
          if (hour === 0) {
            hour = 22;
          } else {
            hour = hour - 2;
          }
          const hours = hour < 10 ? ("0" + hour) : hour;
          window.ModelManager.setActiveModel(hours + ":00");
        }
        break;
      }
      case 221: {
        const name = window.ModelManager._activeModel._name; // FIXME
        if (name.indexOf(":") === -1) {
          window.ModelManager.setActiveModel("00:00");
        } else {
          const tokens = name.split(":");
          let hour = parseInt(tokens[0]);
          if (hour === 22) {
            hour = 0;
          } else {
            hour = hour + 2;
          }
          const hours = hour < 10 ? ("0" + hour) : hour;
          window.ModelManager.setActiveModel(hours + ":00");
        }
        break;
      }
      case 187: { // plus
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
        }
        const zoom = App.getStaticZoom();
        const newZoom = compute.clampZoom(zoom - 1);
        App.adaptiveSetZoom(newZoom, duration);
        break;
      }
      case 189: { // minus
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
        }
        const zoom = App.getStaticZoom();
        const newZoom = compute.clampZoom(zoom + 1);
        App.adaptiveSetZoom(newZoom, duration);
        break;
      }
      case 48: { // 0
        App.adaptiveSetZoom(defs.maxZoom, duration);
        break;
      }
      default: { // 1-9
        if (event.keyCode >= 49 && event.keyCode <= 57) {
          const newZoom = compute.clampZoom(event.keyCode - 49);
          App.adaptiveSetZoom(newZoom, duration);
        }
      }
    }
  },

  onWindowResized: function () {
    App.isDrawingNeeded = true; // TODO
  }
};

module.exports = Controller;
