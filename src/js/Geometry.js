"use strict";

const GeometryLoaderWorker = require("worker?inline!./GeometryLoaderWorker");
const Queue = require("./Queue");

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
  this.pendingAddresses = {};
  this.pendingRoadLinks = {};
  this.pendingRoads = {};
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
        roadNode: this.roadNodes[toid]
      };
    } else if (toid in this.roadLinks) {
      return {
        tag: "roadLink",
        roadLink: this.roadLinks[toid]
      };
    } else if (toid in this.roads) {
      return {
        tag: "road",
        road: this.roads[toid]
      };
    } else {
      return null;
    }
  },

  findShortestRouteBetweenRoadNodes: function (startNode, endNode) {
    if (startNode === endNode) {
      return null;
    } else {
      const parentNodes = {};
      const nodesToVisit = new Queue();
      nodesToVisit.enqueue(startNode);
      while (!nodesToVisit.isEmpty()) {
        let currentNode = nodesToVisit.dequeue();
        if (currentNode === endNode) {
          const roadLinks = this.recoverRoadLinksBetweenRoadNodes(startNode, endNode, parentNodes);
          return {
            tag: "route",
            route: {
              startNode: startNode,
              endNode: endNode,
              roadLinks: roadLinks
            }
          };
        } else {
          const neighborNodes = this.getNeighborNodesForRoadNode(currentNode);
          for (let i = 0; i < neighborNodes.length; i++) {
            if (!(neighborNodes[i].toid in parentNodes)) {
              parentNodes[neighborNodes[i].toid] = currentNode;
              nodesToVisit.enqueue(neighborNodes[i]);
            }
          }
        }
      }
      return null;
    }
  },

  recoverRoadLinksBetweenRoadNodes: function (startNode, endNode, parentNodes) {
    const results = [];
    let currentNode = endNode;
    while (currentNode && currentNode !== startNode) {
      const parentNode = parentNodes[currentNode.toid];
      if (parentNode) {
        for (let i = 0; i < parentNode.roadLinks.length; i++) {
          const roadLink = parentNode.roadLinks[i];
          if (roadLink.negativeNode === parentNode && roadLink.positiveNode === currentNode || roadLink.negativeNode === currentNode && roadLink.positiveNode === parentNode) {
            results.push(roadLink);
          }
        }
      }
      currentNode = parentNode;
    }
    return results;
  },

  recoverRoadNodesBetweenRoadNodes: function (startNode, endNode, parentNodes) {
    const results = [];
    let currentNode = endNode;
    while (currentNode && currentNode !== startNode) {
      results.push(currentNode.toid);
      currentNode = parentNodes[currentNode.toid];
    }
    return results;
  },

  getNeighborNodesForRoadNode: function (roadNode) {
    const neighborNodes = {};
    for (let i = 0; i < roadNode.roadLinks.length; i++) {
      const roadLink = roadNode.roadLinks[i];
      if (roadLink.negativeNode && roadLink.negativeNode !== roadNode) {
        neighborNodes[roadLink.negativeNode.toid] = true;
      }
      if (roadLink.positiveNode && roadLink.positiveNode !== roadNode) {
        neighborNodes[roadLink.positiveNode.toid] = true;
      }
    }
    const toids = Object.keys(neighborNodes);
    const results = [];
    for (let i = 0; i < toids.length; i++) {
      results.push(this.roadNodes[toids[i]]);
    }
    return results;
  },

  getPointForRoadNode: function (roadNode) {
    return {
      x: this.vertexArr[roadNode.vertexOffset * 2],
      y: this.vertexArr[roadNode.vertexOffset * 2 + 1]
    };
  },

  getPointIndexForRoadNode: function (roadNode) {
    return this.roadNodeIndexArr[roadNode.indexOffset];
  },

  getPointsForRoadLink: function (roadLink) {
    const results = [];
    for (let i = 0; i < roadLink.pointCount; i++) {
      const vertexOffset = roadLink.vertexOffset + i;
      results.push({
          x: this.vertexArr[vertexOffset * 2],
          y: this.vertexArr[vertexOffset * 2 + 1]
        });
    }
    return results;
  },

  getPointIndicesForRoadLink: function (roadLink) {
    let indexCount = 0;
    if (roadLink.negativeNode) {
      indexCount++;
    }
    if (roadLink.positiveNode) {
      indexCount++;
    }
    const results = new Uint32Array(indexCount);
    let indexOffset = 0;
    if (roadLink.negativeNode) {
      results[indexOffset++] = this.getPointIndexForRoadNode(roadLink.negativeNode);
    }
    if (roadLink.positiveNode) {
      results[indexOffset++] = this.getPointIndexForRoadNode(roadLink.positiveNode);
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

  getPointIndicesForRoadLinks: function (roadLinks) {
    let indexCount = 0;
    const parts = [];
    for (let i = 0; i < roadLinks.length; i++) {
      const roadLink = roadLinks[i];
      const part = this.getPointIndicesForRoadLink(roadLink);
      indexCount += part.length;
      parts.push(part);
    }
    const results = new Uint32Array(indexCount);
    let indexOffset = 0;
    for (let i = 0; i < roadLinks.length; i++) {
      results.set(parts[i], indexOffset);
      indexOffset += parts[i].length;
    }
    return results;
  },

  getLineIndicesForRoadLinks: function (roadLinks) {
    let indexCount = 0;
    const parts = [];
    for (let i = 0; i < roadLinks.length; i++) {
      const roadLink = roadLinks[i];
      const part = this.getLineIndicesForRoadLink(roadLink);
      indexCount += part.length;
      parts.push(part);
    }
    const results = new Uint32Array(indexCount);
    let indexOffset = 0;
    for (let i = 0; i < roadLinks.length; i++) {
      results.set(parts[i], indexOffset);
      indexOffset += parts[i].length;
    }
    return results;
  },

  getBoundsForRoadLinks: function (margin, roadLinks) {
    let result = rect.invalid;
    for (let i = 0; i < roadLinks.length; i++) {
      const roadLink = roadLinks[i];
      result = rect.union(result, this.getBoundsForRoadLink(margin, roadLink));
    }
    return result;
  },

  getMidpointForRoadLinks: function (roadLinks) {
    return rect.midpoint(this.getBoundsForRoadLinks(0, roadLinks));
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

  onRoadNodesLoaded: function (data) {
    this.isRenderingNeeded = true;
    this.itemCount += data.roadNodes.length;
    this.vertexArr.set(data.vertexArr, this.vertexCount * 2);
    this.vertexCount += data.vertexArr.length / 2;
    this.roadNodeIndexArr.set(data.roadNodeIndexArr, this.roadNodeIndexCount);
    this.roadNodeIndexCount += data.roadNodeIndexArr.length;
    for (let i = 0; i < data.roadNodes.length; i++) {
      this.insertRoadNode(data.roadNodes[i]);
    }
    if (this.props.onRoadNodesLoaded) {
      this.props.onRoadNodesLoaded(data.roadNodes);
    }
  },

  insertRoadNode: function (roadNode) {
    roadNode.address = this.pendingAddresses[roadNode.toid] || null;
    roadNode.roadLinks = this.pendingRoadLinks[roadNode.toid] || [];
    for (let i = 0; i < roadNode.roadLinks.length; i++) {
      const roadLink = roadNode.roadLinks[i];
      if (roadNode.toid === roadLink.negativeNodeTOID) {
        roadLink.negativeNode = roadNode;
        delete roadLink.negativeNodeTOID;
      } else if (roadNode.toid === roadLink.positiveNodeTOID) {
        roadLink.positiveNode = roadNode;
        delete roadLink.positiveNodeTOID;
      }
    }
    this.roadNodes[roadNode.toid] = roadNode;
  },

  onRoadLinksLoaded: function (data) {
    this.isRenderingNeeded = true;
    this.itemCount += data.roadLinks.length;
    this.vertexArr.set(data.vertexArr, this.vertexCount * 2);
    this.vertexCount += data.vertexArr.length / 2;
    this.roadLinkIndexArr.set(data.roadLinkIndexArr, this.roadLinkIndexCount);
    this.roadLinkIndexCount += data.roadLinkIndexArr.length;
    for (let i = 0; i < data.roadLinks.length; i++) {
      this.insertRoadLink(data.roadLinks[i]);
    }
    if (this.props.onRoadLinksLoaded) {
      this.props.onRoadLinksLoaded(data.roadLinks);
    }
  },

  insertRoadLink: function (roadLink) {
    if (roadLink.negativeNodeTOID in this.roadNodes) {
      roadLink.negativeNode = this.roadNodes[roadLink.negativeNodeTOID];
      pushUnique(roadLink.negativeNode, "roadLinks", roadLink);
      delete roadLink.negativeNodeTOID;
    } else {
      pushUnique(this.pendingRoadLinks, roadLink.negativeNodeTOID, roadLink);
    }
    if (roadLink.positiveNodeTOID in this.roadNodes) {
      roadLink.positiveNode = this.roadNodes[roadLink.positiveNodeTOID];
      pushUnique(roadLink.positiveNode, "roadLinks", roadLink);
      delete roadLink.positiveNodeTOID;
    } else {
      pushUnique(this.pendingRoadLinks, roadLink.positiveNodeTOID, roadLink);
    }
    roadLink.roads = this.pendingRoads[roadLink.toid] || [];
    for (let i = 0; i < roadLink.roads.length; i++) {
      const road = roadLink.roads[i];
      pushUnique(road, "roadLinks", roadLink);
    }
    this.roadLinks[roadLink.toid] = roadLink;
  },

  onRoadsLoaded: function (data) {
    this.itemCount += data.roads.length;
    for (let i = 0; i < data.roads.length; i++) {
      this.insertRoad(data.roads[i]);
    }
    if (this.props.onRoadsLoaded) {
      this.props.onRoadsLoaded(data.roads);
    }
  },

  insertRoad: function (road) {
    for (let i = 0; i < road.roadLinkTOIDs.length; i++) {
      const roadLinkTOID = road.roadLinkTOIDs[i];
      if (roadLinkTOID in this.roadLinks) {
        const roadLink = this.roadLinks[roadLinkTOID];
        pushUnique(this.roadLinks[roadLinkTOID], "roads", road);
        pushUnique(road, "roadLinks", roadLink);
      } else {
        pushUnique(this.pendingRoads, roadLinkTOID, road);
      }
    }
    delete road.roadLinkTOIDs;
    this.roads[road.toid] = road;
  },

  onAddressesLoaded: function (data) {
    this.itemCount += data.addresses.length;
    for (let i = 0; i < data.addresses.length; i++) {
      this.insertAddress(data.addresses[i]);
    }
    if (this.props.onAddressesLoaded) {
      this.props.onAddressesLoaded(data.addresses);
    }
  },

  insertAddress: function (address) {
    if (address.toid in this.roadNodes) {
      this.roadNodes[address.toid].address = address.text;
    } else {
      this.pendingAddresses[address.toid] = address.text;
    }
  },

  onLoadingFinished: function () {
    this.worker.terminate();
    delete this.pendingAddresses;
    delete this.pendingRoadLinks;
    delete this.pendingRoads;
    if (this.props.onLoadingFinished) {
      this.props.onLoadingFinished();
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

  drawAllRoadNodes: function (gl) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.roadNodeIndexBuf);
    gl.drawElements(gl.POINTS, this.roadNodeIndexCount, gl.UNSIGNED_INT, 0);
  },

  drawAllRoadLinks: function (gl) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.roadLinkIndexBuf);
    gl.drawElements(gl.LINES, this.roadLinkIndexCount, gl.UNSIGNED_INT, 0);
  }
};

module.exports = Geometry;
