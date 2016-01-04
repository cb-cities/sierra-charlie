"use strict";

var GeometryLoader = require("worker?inline!./GeometryLoader");
var defs = require("./defs");
var rect = require("./rect");


function Geometry(props) {
  this.props = props;
  this.isRenderingNeeded = false;
  this.vertexArr = new Float32Array(defs.maxVertexCount * 2);
  this.vertexCount = 0;
  this.roadNodes = {};
  this.roadNodeIndexArr = new Uint32Array(defs.maxRoadNodeIndexCount);
  this.roadNodeIndexCount = 0;
  this.roadLinks = {};
  this.roadLinkIndexArr = new Uint32Array(defs.maxRoadLinkIndexCount);
  this.roadLinkIndexCount = 0;
  this.loader = new GeometryLoader();
  this.loader.addEventListener("message", this.onMessage.bind(this));
  this.loader.postMessage({
      message: "startLoading",
      origin: window.location.origin
    });
}

Geometry.prototype = {
  isLoadingFinished: function () {
    return this.vertexCount === defs.maxVertexCount;
  },

  getLoadingProgress: function () {
    return this.vertexCount / defs.maxVertexCount * 100;
  },

  getRoadNodePoint: function (roadNode) {
    return {
      x: this.vertexArr[roadNode.vertexOffset * 2],
      y: this.vertexArr[roadNode.vertexOffset * 2 + 1]
    };
  },

  getRoadNodeIndex: function (roadNode) {
    return roadNode.vertexOffset;
  },

  getRoadLinkPoints: function (roadLink) {
    var results = []
    for (var i = 0; i < roadLink.pointCount; i++) {
      var k = roadLink.vertexOffset + i;
      results.push({
          x: this.vertexArr[2 * k],
          y: this.vertexArr[2 * k + 1]
        });
    }
    return results;
  },

  getRoadLinkIndices: function (roadLink) {
    var results = [];
    var indexCount = (roadLink.pointCount - 1) * 2;
    for (var i = 0; i < indexCount; i++) {
      results.push(this.roadLinkIndexArr[roadLink.indexOffset + i]);
    }
    return results;
  },

  getRoadLinkBounds: function (roadLink) {
    var result = rect.invalid;
    for (var i = 0; i < roadLink.pointCount; i++) {
      var k = roadLink.vertexOffset + i;
      result = rect.stretch(result, {
          x: this.vertexArr[2 * k],
          y: this.vertexArr[2 * k + 1]
        });
    }
    return result;
  },

  onMessage: function (event) {
    switch (event.data.message) {
      case "roadNodesLoaded":
        this.onRoadNodesLoaded(event.data);
        break;
      case "roadLinksLoaded":
        this.onRoadLinksLoaded(event.data);
        break;
    }
  },

  onRoadNodesLoaded: function (data) {
    this.isRenderingNeeded = true;
    this.vertexArr.set(data.vertices, this.vertexCount * 2);
    this.vertexCount += data.vertices.length / 2;
    this.roadNodeIndexArr.set(data.roadNodeIndices, this.roadNodeIndexCount);
    this.roadNodeIndexCount += data.roadNodeIndices.length;
    for (var i = 0; i < data.roadNodes.length; i++) {
      var roadNode = data.roadNodes[i];
      this.roadNodes[roadNode.toid] = roadNode;
    }
    if (this.isLoadingFinished()) {
      this.loader.terminate();
    }
    if (this.props.onRoadNodesLoaded) {
      this.props.onRoadNodesLoaded(data.roadNodes);
    }
  },

  onRoadLinksLoaded: function (data) {
    this.isRenderingNeeded = true;
    this.vertexArr.set(data.vertices, this.vertexCount * 2);
    this.vertexCount += data.vertices.length / 2;
    this.roadLinkIndexArr.set(data.roadLinkIndices, this.roadLinkIndexCount);
    this.roadLinkIndexCount += data.roadLinkIndices.length;
    for (var i = 0; i < data.roadLinks.length; i++) {
      var roadLink = data.roadLinks[i];
      this.roadLinks[roadLink.toid] = roadLink;
    }
    if (this.isLoadingFinished()) {
      this.loader.terminate();
    }
    if (this.props.onRoadLinksLoaded) {
      this.props.onRoadLinksLoaded(data.roadLinks);
    }
  },

  render: function (gl) {
    if (this.isRenderingNeeded) {
      var usage = this.isLoadingFinished ? gl.STATIC_DRAW : gl.STREAM_DRAW;
      this.isRenderingNeeded = false;
      this.vertexBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
      gl.bufferData(gl.ARRAY_BUFFER, this.vertexArr, usage);
      this.roadNodeIndexBuf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.roadNodeIndexBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.roadNodeIndexArr, usage);
      this.roadLinkIndexBuf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.roadLinkIndexBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.roadLinkIndexArr, usage);
      return true;
    } else {
      return false;
    }
  },

  bindVertexBuffer: function (gl) {
    if (this.vertexBuf) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
      return true;
    } else {
      return false;
    }
  },

  drawRoadNodes: function (gl) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.roadNodeIndexBuf);
    gl.drawElements(gl.POINTS, this.roadNodeIndexCount, gl.UNSIGNED_INT, 0);
  },

  drawRoadLinks: function (gl) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.roadLinkIndexBuf);
    gl.drawElements(gl.LINES, this.roadLinkIndexCount, gl.UNSIGNED_INT, 0);
  }
}

module.exports = Geometry;
