"use strict";

const GeometryLoaderWorker = require("worker?inline!./GeometryLoaderWorker");
const PriorityQueue = require("./PriorityQueue");

const array = require("./lib/array");
const defs = require("./defs");
const rect = require("./lib/rect");
const vector = require("./lib/vector");


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
  this.roadNodeIndexArr = new Uint32Array(defs.maxRoadNodeCount);
  this.roadNodeCount = 0;
  this.roadLinks = {};
  this.roadLinkIndexArr = new Uint32Array(defs.maxRoadLinkIndexCount);
  this.roadLinkIndexCount = 0;
  this.roads = {};
  this.pendingAddresses = {};
  this.pendingRoadLinks = {};
  this.pendingRoads = {};
  this.loadingStartDate = Date.now();
  this.loadingMessageCount = 0;
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

  findShortestRouteBetweenRoadNodes: function (startNode, endNode, adjustment, whiteList) {
    if (startNode === endNode) {
      return {
        toid: "route" + Date.now(),
        startNode: startNode,
        endNode: endNode,
        roadLinks: []
      };
    } else {
      const parentNodes = {};
      const parentLinks = {};
      const costs = {};
      const frontier = new PriorityQueue();
      costs[startNode.toid] = 0;
      frontier.enqueue(startNode, 0);
      while (!frontier.isEmpty()) {
        let current = frontier.dequeue();
        if (current === endNode) {
          const roadLinks = this.recoverRoadLinksBetweenRoadNodes(startNode, endNode, parentNodes, parentLinks);
          return {
            toid: "route" + Date.now(),
            startNode: startNode,
            endNode: endNode,
            roadLinks: roadLinks
          };
        } else {
          const neighbors = this.getNeighborsForRoadNode(current, adjustment);
          for (let i = 0; i < neighbors.length; i++) {
            const next = neighbors[i].roadNode;
            const linkCost = neighbors[i].roadLink.length * (neighbors[i].roadLink.penalty + ((whiteList && whiteList.indexOf(next) === -1) ? 10 : 1)); // TODO
            const nextCost = costs[current.toid] + linkCost;
            if (!(next.toid in costs) || nextCost < costs[next.toid]) {
              const nextHeuristic = this.getDistanceBetweenRoadNodes(next, endNode);
              const nextPriority = nextCost + nextHeuristic;
              parentNodes[next.toid] = current;
              parentLinks[next.toid] = neighbors[i].roadLink;
              costs[next.toid] = nextCost;
              frontier.enqueue(next, nextPriority);
            }
          }
        }
      }
      return {
        toid: "route" + Date.now(),
        startNode: startNode,
        endNode: endNode,
        roadLinks: []
      };
    }
  },

  getDistanceBetweenRoadNodes: function (startNode, endNode) {
    return vector.distance(startNode.point, endNode.point);
  },

  recoverRoadLinksBetweenRoadNodes: function (startNode, endNode, parentNodes, parentLinks) {
    const results = [];
    let current = endNode;
    while (current && current !== startNode) {
      const parent = parentNodes[current.toid];
      if (parent) {
        results.push(parentLinks[current.toid]);
      }
      current = parent;
    }
    return results;
  },

  recoverRoadNodesBetweenRoadNodes: function (startNode, endNode, parentNodes) {
    const results = [];
    let current = endNode;
    while (current && current !== startNode) {
      results.push(current.toid);
      current = parentNodes[current.toid];
    }
    return results;
  },

  getNeighborsForRoadNode: function (roadNode, adjustment) { // TODO: Refactor
    const results = [];
    if (adjustment) {
      for (let i = 0; i < roadNode.roadLinks.length; i++) {
        const roadLink = roadNode.roadLinks[i];
        if (!adjustment.isRoadLinkDeleted(roadLink)) {
          if (roadLink.negativeNode === roadNode) {
            if (roadLink.positiveNode && !adjustment.isRoadNodeDeleted(roadLink.positiveNode)) {
              results.push({
                  roadNode: roadLink.positiveNode,
                  roadLink: roadLink
                });
            }
          } else if (roadLink.positiveNode === roadNode) {
            if (roadLink.negativeNode && !adjustment.isRoadNodeDeleted(roadLink.negativeNode)) {
              results.push({
                  roadNode: roadLink.negativeNode,
                  roadLink: roadLink
                });
            }
          }
        }
      }
    } else {
      for (let i = 0; i < roadNode.roadLinks.length; i++) {
        const roadLink = roadNode.roadLinks[i];
        if (roadLink.negativeNode === roadNode) {
          if (roadLink.positiveNode) {
            results.push({
                roadNode: roadLink.positiveNode,
                roadLink: roadLink
              });
          }
        } else if (roadLink.positiveNode === roadNode) {
          if (roadLink.negativeNode) {
            results.push({
                roadNode: roadLink.negativeNode,
                roadLink: roadLink
              });
          }
        }
      }
    }
    return results;
  },

  getPointIndexForRoadNode: function (roadNode) {
    return this.roadNodeIndexArr[roadNode.indexOffset];
  },

  getPointIndicesForRoadNodes: function (roadNodes) {
    const results = [];
    for (let i = 0; i < roadNodes.length; i++) {
      results.push(this.roadNodeIndexArr[roadNodes[i].indexOffset]);
    }
    return results;
  },

  getPointsForRoadLink: function (roadLink) {
    const start = roadLink.vertexOffset * 2;
    const end = start + roadLink.pointCount * 2;
    return array.sliceFloat32(this.vertexArr, start, end);
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
    return rect.bounds(margin, roadLink.bounds);
  },

  getMidpointForRoadLink: function (roadLink) {
    return rect.midpoint(roadLink.bounds);
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
      result = rect.union(result, roadLink.bounds);
    }
    return rect.bounds(margin, result);
  },

  getMidpointForRoadLinks: function (roadLinks) {
    return rect.midpoint(this.getBoundsForRoadLinks(0, roadLinks));
  },

  onMessage: function (event) {
    this.loadingMessageCount++;
    switch (event.data.message) {
      case "roadNodesLoaded":
        this.onRoadNodesLoaded(event.data);
        break;
      case "roadLinksLoaded":
        this.onRoadLinksLoaded(event.data);
        break;
      case "roadsLoaded":
        this.onRoadsLoaded(event.data);
        break;
      case "addressesLoaded":
        this.onAddressesLoaded(event.data);
        break;
    }
    if (this.isLoadingFinished()) {
      const loadingTime = (Date.now() - this.loadingStartDate) / 1000;
      console.log("Loading finished in " + loadingTime + " seconds, using " + this.loadingMessageCount + " messages");
      this.onLoadingFinished();
    }
  },

  onRoadNodesLoaded: function (data) {
    this.isRenderingNeeded = true;
    this.itemCount += data.roadNodes.length;
    this.vertexArr.set(data.vertexArr, this.vertexCount * 2);
    this.vertexCount += data.vertexArr.length / 2;
    this.roadNodeIndexArr.set(data.roadNodeIndexArr, this.roadNodeCount);
    this.roadNodeCount += data.roadNodeIndexArr.length;
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
    gl.drawElements(gl.POINTS, this.roadNodeCount, gl.UNSIGNED_INT, 0);
  },

  drawAllRoadLinks: function (gl) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.roadLinkIndexBuf);
    gl.drawElements(gl.LINES, this.roadLinkIndexCount, gl.UNSIGNED_INT, 0);
  }
};

module.exports = Geometry;
