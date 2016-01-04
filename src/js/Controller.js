"use strict";

var Indexset = require("./Indexset");
var Polyquadtree = require("./Polyquadtree");
var Quadtree = require("./Quadtree");

var compute = require("./compute");
var vector = require("./vector");


function Controller(props) {
  this.props = props;
  window.RoadNodeTree = this.roadNodeTree = new Quadtree(this.props.treeLeft, this.props.treeTop, this.props.treeSize, function (roadNode) {
      return App.getRoadNodePoint(roadNode);
    }); // TODO
  window.RoadLinkTree = this.roadLinkTree = new Polyquadtree(this.props.treeLeft, this.props.treeTop, this.props.treeSize, function (roadLink) {
      return App.getRoadLinkBounds(roadLink);
    }); // TODO
  this.hoveredRoadNodeIndices = new Indexset();
  this.hoveredRoadLinkIndices = new Indexset();
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

  projectMouseToWorld: function (event) {
    return (
      this.projectRectToWorld(vector.bounds(16, {
          x: event.clientX,
          y: event.clientY
        })));
  },

  onLoadRoadNodes: function (roadNodes) {
    for (var i = 0; i < roadNodes.length; i++) {
      this.roadNodeTree.insert(roadNodes[i]);
    }
  },

  onLoadRoadLinks: function (roadLinks) {
    for (var i = 0; i < roadLinks.length; i++) {
      this.roadLinkTree.insert(roadLinks[i]);
    }
  },

  onMouseMove: function (event) {
    // console.log("mouseMove", event.clientX, event.clientY);
    var mouse = this.projectMouseToWorld(event);
    var roadNodes = this.roadNodeTree.select(mouse);
    this.hoveredRoadNodeIndices.clear();
    for (var i = 0; i < roadNodes.length; i++) {
      var index = App.getRoadNodeIndex(roadNodes[i]); // TODO
      this.hoveredRoadNodeIndices.insert(index);
    }
    var roadLinks = this.roadLinkTree.select(mouse);
    this.hoveredRoadLinkIndices.clear();
    for (var i = 0; i < roadLinks.length; i++) {
      var indices = App.getRoadLinkIndices(roadLinks[i]); // TODO
      this.hoveredRoadLinkIndices.insertMany(indices);
    }
    var gl = App.painterContext.gl; // TODO
    this.hoveredRoadNodeIndices.render(gl, gl.STREAM_DRAW);
    this.hoveredRoadLinkIndices.render(gl, gl.STREAM_DRAW);
    App.needsPainting = true; // TODO
    App.hoveredRoadNodeIndices = this.hoveredRoadNodeIndices; // OMG
    App.hoveredRoadLinkIndices = this.hoveredRoadLinkIndices; // OMG
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
