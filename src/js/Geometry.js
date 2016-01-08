"use strict";

const GeometryLoaderWorker = require("worker?inline!./GeometryLoaderWorker");

const defs = require("./defs");
const rect = require("./rect");


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
  this.tmpRoadLinksOfRoadNode = {};
  this.tmpRoadsOfRoadLink = {};
  this.tmpAddressOfRoadNode = {};
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

  getFeature: function (toid) {
    if (toid in this.roadNodes) {
      return {
        tag: "roadNode",
        roadNode: this.roadNodes[toid],
        roadLink: null
      };
    } else if (toid in this.roadLinks) {
      return {
        tag: "roadLink",
        roadLink: this.roadLinks[toid],
        roadNode: null
      };
    } else {
      return null;
    }
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
    let results = [];
    for (let i = 0; i < roadLink.pointCount; i++) {
      const k = roadLink.vertexOffset + i;
      results.push({
          x: this.vertexArr[2 * k],
          y: this.vertexArr[2 * k + 1]
        });
    }
    return results;
  },

  getRoadLinkIndices: function (roadLink) {
    let results = [];
    const indexCount = (roadLink.pointCount - 1) * 2;
    for (let i = 0; i < indexCount; i++) {
      results.push(this.roadLinkIndexArr[roadLink.indexOffset + i]);
    }
    return results;
  },

  getRoadLinkBounds: function (roadLink) {
    let result = rect.invalid;
    for (let i = 0; i < roadLink.pointCount; i++) {
      const k = roadLink.vertexOffset + i;
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
      case "roadsLoaded":
        this.onRoadsLoaded(event.data);
        break;
      case "addressesLoaded":
        this.onAddressesLoaded(event.data);
        break;
    }
    if (this.isLoadingFinished()) {
      this.onLoadingFinished();
    }
  },

  onLoadingFinished: function () {
    this.worker.terminate();
    delete this.tmpRoadLinksOfRoadNode;
    delete this.tmpRoadsOfRoadLink;
    delete this.tmpAddressOfRoadNode;
    const roadLinkToids = Object.keys(this.roadLinks);
    for (let i = 0; i < roadLinkToids.length; i++) {
      const toid = roadLinkToids[i];
      let roadLink = this.roadLinks[toid];
      if (!(roadLink.negativeNode in this.roadNodes)) {
        roadLink.negativeNode = null;
      }
      if (!(roadLink.positiveNode in this.roadNodes)) {
        roadLink.positiveNode = null;
      }
    }
    const roadToids = Object.keys(this.roads);
    for (let j = 0; j < roadToids.length; j++) {
      const toid = roadToids[j];
      let road = this.roads[toid];
      let members = [];
      for (let k = 0; k < road.members.length; k++) {
        if (road.members[k] in this.roadLinks) {
          members.push(road.members[k]);
        }
      }
      road.members = members;
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
      let roadNode = data.roadNodes[i];
      const toid = roadNode.toid;
      if (toid in this.tmpRoadLinksOfRoadNode) {
        roadNode.roadLinks = this.tmpRoadLinksOfRoadNode[toid];
      } else {
        roadNode.roadLinks = [];
      }
      if (toid in this.tmpAddressOfRoadNode) {
        roadNode.address = this.tmpAddressOfRoadNode[toid];
      }
      this.roadNodes[toid] = roadNode;
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
      let roadLink = data.roadLinks[i];
      const toid = roadLink.toid;
      if (toid in this.tmpRoadsOfRoadLink) {
        roadLink.roads = this.tmpRoadsOfRoadLink[toid];
      } else {
        roadLink.roads = [];
      }
      if (roadLink.negativeNode in this.roadNodes) {
        this.roadNodes[roadLink.negativeNode].roadLinks.push(toid);
      } else {
        if (!(roadLink.negativeNode in this.tmpRoadLinksOfRoadNode)) {
          this.tmpRoadLinksOfRoadNode[roadLink.negativeNode] = [];
        }
        this.tmpRoadLinksOfRoadNode[roadLink.negativeNode].push(toid);
      }
      if (roadLink.positiveNode in this.roadNodes) {
        this.roadNodes[roadLink.positiveNode].roadLinks.push(toid);
      } else {
        if (!(roadLink.positiveNode in this.tmpRoadLinksOfRoadNode)) {
          this.tmpRoadLinksOfRoadNode[roadLink.positiveNode] = [];
        }
        this.tmpRoadLinksOfRoadNode[roadLink.positiveNode].push(toid);
      }
      this.roadLinks[toid] = roadLink;
    }
    if (this.props.onRoadLinksLoaded) {
      this.props.onRoadLinksLoaded(data.roadLinks);
    }
  },

  onRoadsLoaded: function (data) {
    this.itemCount += data.roads.length;
    for (let i = 0; i < data.roads.length; i++) {
      let road = data.roads[i];
      const toid = road.toid;
      for (let j = 0; j < road.members.length; j++) {
        const member = road.members[j];
        if (member in this.roadLinks) {
          // this.roadLinks[member].roads.push(toid); // TODO
          if (this.roadLinks[member].roads.indexOf(road.name) === -1) {
            this.roadLinks[member].roads.push(road.name);
          }
        } else {
          if (!(member in this.tmpRoadsOfRoadLink)) {
            this.tmpRoadsOfRoadLink[member] = [];
          }
          // this.tmpRoadsOfRoadLink[member].push(toid); // TODO
          if (this.tmpRoadsOfRoadLink[member].indexOf(road.name) === -1) {
            this.tmpRoadsOfRoadLink[member].push(road.name);
          }
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
        this.tmpAddressOfRoadNode[toid] = address.text;
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
