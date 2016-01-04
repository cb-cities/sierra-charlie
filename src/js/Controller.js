"use strict";

var Geometry = require("./Geometry");
var Indexset = require("./Indexset");
var Polyquadtree = require("./Polyquadtree");
var Quadtree = require("./Quadtree");

var compute = require("./compute");
var vector = require("./vector");


function Controller(props) {
  this.props = props;
  this.lastClientX = 0;
  this.lastClientY = 0;
  window.Geometry = this.geometry = new Geometry({ // TODO
      maxVertexCount: this.props.maxVertexCount,
      maxRoadNodeIndexCount: this.props.maxRoadNodeIndexCount,
      maxRoadLinkIndexCount: this.props.maxRoadLinkIndexCount,
      origin: window.location.origin,
      onRoadNodesLoaded: this.onRoadNodesLoaded.bind(this),
      onRoadLinksLoaded: this.onRoadLinksLoaded.bind(this)
    });
  window.RoadNodeTree = this.roadNodeTree = new Quadtree(this.props.treeLeft, this.props.treeTop, this.props.treeSize, this.geometry.getRoadNodePoint.bind(this.geometry)); // TODO
  window.RoadLinkTree = this.roadLinkTree = new Polyquadtree(this.props.treeLeft, this.props.treeTop, this.props.treeSize, this.geometry.getRoadLinkBounds.bind(this.geometry)); // TODO
  this.hoveredRoadNodeIndices = new Indexset();
  this.hoveredRoadLinkIndices = new Indexset();
  // this.roadNodeTreeLines = new Lineset(); // TODO
  // this.roadLinkTreeLines = new Lineset();
}

Controller.prototype = {
  projectPointToWorld: function (clientX, clientY) {
    var clientWidth = App.getClientWidth();
    var clientHeight = App.getClientHeight();
    var left = App.getLeft();
    var top = App.getTop();
    var zoom = App.getZoom();
    var zoomLevel = compute.zoomLevel(zoom);
    var dilation = this.props.tileSize / this.props.imageSize * zoomLevel; // TODO: Compare with drawing
    var translationX = (this.props.firstTileX + left * this.props.tileXCount) * this.props.tileSize;
    var translationY = (this.props.lastTileY + 1 - top * this.props.tileYCount) * this.props.tileSize;
    return {
      x: (clientX - clientWidth / 2) * dilation + translationX,
      y: ((clientHeight - clientY) - clientHeight / 2) * dilation + translationY
    };
  },

  projectRectToWorld: function (clientR) {
    var bottomLeft = this.projectPointToWorld(clientR.left, clientR.top);
    var topRight = this.projectPointToWorld(clientR.right, clientR.bottom);
    return {
      left: bottomLeft.x,
      top: topRight.y,
      right: topRight.x,
      bottom: bottomLeft.y
    };
  },

  updateHover: function (clientX, clientY) {
    var mouse =
      this.projectRectToWorld(vector.bounds(16, {
          x: clientX,
          y: clientY
        }))
    var roadNodes = this.roadNodeTree.select(mouse);
    this.hoveredRoadNodeIndices.clear();
    for (var i = 0; i < roadNodes.length; i++) {
      var index = this.geometry.getRoadNodeIndex(roadNodes[i]);
      this.hoveredRoadNodeIndices.insert(index);
    }
    var roadLinks = this.roadLinkTree.select(mouse);
    this.hoveredRoadLinkIndices.clear();
    for (var i = 0; i < roadLinks.length; i++) {
      var indices = this.geometry.getRoadLinkIndices(roadLinks[i]);
      this.hoveredRoadLinkIndices.insertMany(indices);
    }
    var gl = App.painterContext.gl; // TODO
    this.hoveredRoadNodeIndices.render(gl, gl.STREAM_DRAW);
    this.hoveredRoadLinkIndices.render(gl, gl.STREAM_DRAW);
    App.needsPainting = true; // TODO
    App.hoveredRoadNodeIndices = this.hoveredRoadNodeIndices; // OMG
    App.hoveredRoadLinkIndices = this.hoveredRoadLinkIndices; // OMG
  },

  onRoadNodesLoaded: function (roadNodes) {
    for (var i = 0; i < roadNodes.length; i++) {
      this.roadNodeTree.insert(roadNodes[i]);
    }
    App.updatePainterContext(); // TODO
    UI.ports.setVertexCount.send(this.geometry.vertexCount); // TODO
    
    // var gl = this.painterContext.gl; // TODO
    // this.roadNodeTreeLines.clear();
    // this.roadNodeTree.extendLineset(this.roadNodeTreeLines);
    // this.roadNodeTreeLines.render(gl, gl.STATIC_DRAW);

    // var s = this.roadNodeTree.extendStats({itemCounts: [], nodeSizes: []});
    // console.log("RN item counts\n", stats.dump(s.itemCounts));
    // console.log("RN node sizes\n", stats.dump(s.nodeSizes));
    // console.log("RN tree size: ", s.nodeSizes.length);
  },

  onRoadLinksLoaded: function (roadLinks) {
    for (var i = 0; i < roadLinks.length; i++) {
      this.roadLinkTree.insert(roadLinks[i]);
    }
    App.updatePainterContext(); // TODO
    UI.ports.setVertexCount.send(this.geometry.vertexCount); // TODO
    
    // var gl = this.painterContext.gl; // TODO
    // this.roadLinkTreeLines.clear();
    // this.roadLinkTree.extendLineset(this.roadLinkTreeLines);
    // this.roadLinkTreeLines.render(gl, gl.STATIC_DRAW);

    // var s = this.roadLinkTree.extendStats({itemCounts: [], nodeSizes: []});
    // console.log("RL item counts\n", stats.dump(s.itemCounts));
    // console.log("RL node sizes\n", stats.dump(s.nodeSizes));
    // console.log("RL tree size: ", s.nodeSizes.length);
  },

  onScroll: function (event) {
    if (!(App.isScrolling())) {
      var frame = document.getElementById("map-frame");
      var zoom = App.getZoom();
      var newLeft = compute.leftFromFrameScrollLeft(frame.scrollLeft, zoom);
      var newTop = compute.topFromFrameScrollTop(frame.scrollTop, zoom);
      App.setStaticLeftTop(newLeft, newTop);
    }
    this.updateHover(this.lastClientX, this.lastClientY);
  },
  
  onContextLost: function (event) {
    event.preventDefault();
    // cancelAnimationFrame(this.painterReceipt); // TODO
    // this.painterContext = null;
    // this.painterReceipt = null;
  },

  onContextRestored: function () {
    // this.startPainter(); // TODO
  },

  onMouseMove: function (event) {
    // console.log("mouseMove", event.clientX, event.clientY);
    this.updateHover(event.clientX, event.clientY);
    this.lastClientX = event.clientX;
    this.lastClientY = event.clientY;
  },

  onDoubleClick: function (event) {
    // console.log("doubleClick", event.clientX, event.clientY);
    var clientWidth = App.getClientWidth();
    var clientHeight = App.getClientHeight();
    var left = App.getStaticLeft();
    var top = App.getStaticTop();
    var zoom = App.getStaticZoom();
    var newLeft = compute.leftFromEventClientX(event.clientX, clientWidth, left, zoom);
    var newTop = compute.topFromEventClientY(event.clientY, clientHeight, top, zoom);
    var newZoom = event.altKey ? Math.min(zoom + 1, this.props.maxZoom) : Math.max(0, zoom - 1);
    var duration = event.shiftKey ? 2500 : 500;
    App.setLeft(newLeft, duration);
    App.setTop(newTop, duration);
    App.setZoom(newZoom, duration);
  },

  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    var clientWidth = App.getClientWidth();
    var clientHeight = App.getClientHeight();
    var left = App.getStaticLeft();
    var top = App.getStaticTop();
    var rawTime = App.getStaticRawTime();
    var zoom = App.getStaticZoom();
    var pageWidth = compute.pageWidth(clientWidth, zoom);
    var pageHeight = compute.pageHeight(clientHeight, zoom);
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
        var newZoom = Math.min(Math.round((zoom * 10) + zoomDelta) / 10, this.props.maxZoom);
        App.setZoom(newZoom, duration);
        break;
      default: // 1-8
        if (event.keyCode >= 49 && event.keyCode <= 57) {
          var newZoom = Math.max(0, Math.min(event.keyCode - 49, this.props.maxZoom));
          App.setZoom(newZoom, duration);
        }
    }
  }
};

module.exports = Controller;
