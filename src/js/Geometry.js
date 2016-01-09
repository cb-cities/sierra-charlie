"use strict";

const GeometryLoaderWorker = require("worker?inline!./GeometryLoaderWorker");

const array = require("./array");
const defs = require("./defs");
const rect = require("./rect");
const polyline = require("./polyline");


function pushUnique(arr, key, val) {
  if (!(key in arr)) {
    arr[key] = [val];
  } else if (arr[key].indexOf(val) === -1) {
    arr[key].push(val);
  }
}


function Geometry(props) {
  this.props = props;
  this.isRenderingNeeded = false;
  this.itemCount = 0;
  this.vertexArr = new Float32Array(defs.maxVertexCount * 2);
  this.vertexCount = 0;
  this.roadNodes = {};
  this.roadNodeIndexArr = new Uint32Array(defs.maxRoadNodeIndexCount);
  this.roadNodeIndexCount = 0;
  this.roadLinks = {};
  this.roadLinkIndexArr = new Uint32Array(defs.maxRoadLinkIndexCount);
  this.roadLinkIndexCount = 0;
  this.roads = {};
  this.addressForUnloadedNode = {};
  this.linksForUnloadedNode = {};
  this.roadsForUnloadedLink = {};
  this.worker = new GeometryLoaderWorker();
  this.worker.addEventListener("message", this.onMessage.bind(this));
  this.worker.postMessage({
      message: "startLoading",
      origin: window.location.origin
    });
}

Geometry.prototype = {
  getItemCount: function () {
    return this.itemCount;
  },

  isLoadingFinished: function () {
    return this.itemCount === defs.maxGeometryItemCount;
  },

  getFeatureByTOID: function (toid) {
    if (toid in this.roadNodes) {
      return {
        tag: "roadNode",
        roadNode: this.roadNodes[toid],
        roadLink: null,
        road: null
      };
    } else if (toid in this.roadLinks) {
      return {
        tag: "roadLink",
        roadNode: null,
        roadLink: this.roadLinks[toid],
        road: null
      };
    } else if (toid in this.roads) {
      return {
        tag: "road",
        roadNode: null,
        roadLink: null,
        road: this.roads[toid]
      };
    } else {
      return null;
    }
  },

  getPointForRoadNode: function (roadNode) {
    return {
      x: this.vertexArr[roadNode.vertexOffset * 2],
      y: this.vertexArr[roadNode.vertexOffset * 2 + 1]
    };
  },

  getPointIndexForRoadNode: function (roadNode) {
    return roadNode.vertexOffset;
  },

  getPointsForRoadLink: function (roadLink) {
    const results = [];
    for (let i = 0; i < roadLink.pointCount; i++) {
      const k = roadLink.vertexOffset + i;
      results.push({
          x: this.vertexArr[2 * k],
          y: this.vertexArr[2 * k + 1]
        });
    }
    return results;
  },

  getLineIndicesForRoadLink: function (roadLink) {
    const start = roadLink.indexOffset;
    const end = start + (roadLink.pointCount - 1) * 2;
    return array.sliceUint32(this.roadLinkIndexArr, start, end);
  },

  getBoundsForRoadLink: function (margin, roadLink) {
    return polyline.bounds(margin, this.getPointsForRoadLink(roadLink));
  },

  getMidpointForRoadLink: function (roadLink) {
    return polyline.midpoint(this.getPointsForRoadLink(roadLink));
  },

  getBoundsForRoad: function (margin, road) {
    let result = rect.invalid;
    for (let i = 0; i < road.roadLinks.length; i++) {
      const link = this.roadLinks[road.roadLinks[i]];
      result = rect.union(result, this.getBoundsForRoadLink(margin, link));
    }
    return result;
  },

  getMidpointForRoad: function (road) {
    return rect.midpoint(this.getBoundsForRoad(0, road));
  },

  getLineIndicesForRoad: function (road) {
    const parts = [];
    let count = 0;
    for (let i = 0; i < road.roadLinks.length; i++) {
      const link = this.roadLinks[road.roadLinks[i]];
      const part = this.getLineIndicesForRoadLink(link);
      parts.push(part);
      count += part.length;
    }
    const results = new Uint32Array(count);
    let offset = 0;
    for (let i = 0; i < road.roadLinks.length; i++) {
      results.set(parts[i], offset);
      offset += parts[i].length;
    }
    return results;
  },

  onMessage: function (event) {
    switch (event.data.message) {
      case "roadNodesLoaded": {
        this.onRoadNodesLoaded(event.data);
        break;
      }
      case "roadLinksLoaded": {
        this.onRoadLinksLoaded(event.data);
        break;
      }
      case "roadsLoaded": {
        this.onRoadsLoaded(event.data);
        break;
      }
      case "addressesLoaded": {
        this.onAddressesLoaded(event.data);
        break;
      }
    }
    if (this.isLoadingFinished()) {
      this.onLoadingFinished();
    }
  },

  onLoadingFinished: function () {
    this.worker.terminate();
    delete this.addressForUnloadedNode;
    delete this.linksForUnloadedNode;
    delete this.roadsForUnloadedLink;
    const roadLinkToids = Object.keys(this.roadLinks);
    for (let i = 0; i < roadLinkToids.length; i++) {
      const roadLink = this.roadLinks[roadLinkToids[i]];
      delete roadLink.unloadedNegativeNode;
      delete roadLink.unloadedPositiveNode;
    }
    const roadToids = Object.keys(this.roads);
    for (let j = 0; j < roadToids.length; j++) {
      const road = this.roads[roadToids[j]];
      delete road.unloadedLinks;
    }
    if (this.props.onLoadingFinished) {
      this.props.onLoadingFinished();
    }
  },

  onRoadNodesLoaded: function (data) {
    this.isRenderingNeeded = true;
    this.itemCount += data.roadNodes.length;
    this.vertexArr.set(data.vertexArr, this.vertexCount * 2);
    this.vertexCount += data.vertexArr.length / 2;
    this.roadNodeIndexArr.set(data.roadNodeIndexArr, this.roadNodeIndexCount);
    this.roadNodeIndexCount += data.roadNodeIndexArr.length;
    for (let i = 0; i < data.roadNodes.length; i++) {
      const node = data.roadNodes[i];
      const toid = node.toid;
      node.address = this.addressForUnloadedNode[toid] || null;
      node.roadLinks = this.linksForUnloadedNode[toid] || [];
      for (let j = 0; j < node.roadLinks.length; j++) {
        const link = this.roadLinks[node.roadLinks[j]];
        if (toid === link.unloadedNegativeNode) {
          link.negativeNode = toid;
        } else if (toid === link.unloadedPositiveNode) {
          link.positiveNode = toid;
        }
      }
      this.roadNodes[toid] = node;
    }
    if (this.props.onRoadNodesLoaded) {
      this.props.onRoadNodesLoaded(data.roadNodes);
    }
  },

  onRoadLinksLoaded: function (data) {
    this.isRenderingNeeded = true;
    this.itemCount += data.roadLinks.length;
    this.vertexArr.set(data.vertexArr, this.vertexCount * 2);
    this.vertexCount += data.vertexArr.length / 2;
    this.roadLinkIndexArr.set(data.roadLinkIndexArr, this.roadLinkIndexCount);
    this.roadLinkIndexCount += data.roadLinkIndexArr.length;
    for (let i = 0; i < data.roadLinks.length; i++) {
      const link = data.roadLinks[i];
      const toid = link.toid;
      if (link.unloadedNegativeNode in this.roadNodes) {
        pushUnique(this.roadNodes[link.unloadedNegativeNode], "roadLinks", toid);
        link.negativeNode = link.unloadedNegativeNode;
      } else {
        pushUnique(this.linksForUnloadedNode, link.unloadedNegativeNode, toid);
      }
      if (link.unloadedPositiveNode in this.roadNodes) {
        pushUnique(this.roadNodes[link.unloadedPositiveNode], "roadLinks", toid);
        link.positiveNode = link.unloadedPositiveNode;
      } else {
        pushUnique(this.linksForUnloadedNode, link.unloadedPositiveNode, toid);
      }
      link.roads = this.roadsForUnloadedLink[toid] || [];
      for (let j = 0; j < link.roads.length; j++) {
        const road = link.roads[j];
        pushUnique(road, "roadLinks", toid);
      }
      this.roadLinks[toid] = link;
    }
    if (this.props.onRoadLinksLoaded) {
      this.props.onRoadLinksLoaded(data.roadLinks);
    }
  },

  onRoadsLoaded: function (data) {
    this.itemCount += data.roads.length;
    for (let i = 0; i < data.roads.length; i++) {
      const road = data.roads[i];
      const toid = road.toid;
      for (let j = 0; j < road.unloadedLinks.length; j++) {
        const link = road.unloadedLinks[j];
        if (link in this.roadLinks) {
          pushUnique(this.roadLinks[link], "roads", road);
          pushUnique(road, "roadLinks", link);
        } else {
          pushUnique(this.roadsForUnloadedLink, link, road);
        }
      }
      this.roads[toid] = road;
    }
    if (this.props.onRoadsLoaded) {
      this.props.onRoadsLoaded(data.roads);
    }
  },

  onAddressesLoaded: function (data) {
    this.itemCount += data.addresses.length;
    for (let i = 0; i < data.addresses.length; i++) {
      const address = data.addresses[i];
      const toid = address.toid;
      if (toid in this.roadNodes) {
        this.roadNodes[toid].address = address.text;
      } else {
        this.addressForUnloadedNode[toid] = address.text;
      }
    }
    if (this.props.onAddressesLoaded) {
      this.props.onAddressesLoaded(data.addresses);
    }
  },

  render: function (gl) {
    if (this.isRenderingNeeded) {
      const usage = this.isLoadingFinished ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
      this.isRenderingNeeded = false;
      if (!this.vertexBuf) { // TODO
        this.vertexBuf = gl.createBuffer();
        this.roadNodeIndexBuf = gl.createBuffer();
        this.roadLinkIndexBuf = gl.createBuffer();
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
      gl.bufferData(gl.ARRAY_BUFFER, this.vertexArr, usage);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.roadNodeIndexBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.roadNodeIndexArr, usage);
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
};

module.exports = Geometry;
