"use strict";

const oboe = require("oboe");
const simplify = require("simplify-js");

const defs = require("./defs");


function sliceFloat32Array(array, offset, count) {
  return new Float32Array(array.buffer.slice(offset * 4, count * 4));
}


function sliceUint32Array(array, offset, count) {
  return new Uint32Array(array.buffer.slice(offset * 4, count * 4));
}


function GeometryLoader() {
  this.itemCount = 0;
  this.vertexArr = new Float32Array(defs.maxVertexCount * 2);
  this.vertexCount = 0;
  this.vertexOffset = 0;
  this.roadNodeIndexArr = new Uint32Array(defs.maxRoadNodeIndexCount);
  this.roadNodeIndexCount = 0;
  this.roadNodeIndexOffset = 0;
  this.roadNodes = [];
  this.roadLinkIndexArr = new Uint32Array(defs.maxRoadLinkIndexCount);
  this.roadLinkIndexCount = 0;
  this.roadLinkIndexOffset = 0;
  this.roadLinkPointCount = 0;
  this.roadLinks = [];
  this.roads = [];
  this.addresses = [];
  this.postedItemCount = 0;
  this.prevPostingDate = 0;
}

GeometryLoader.prototype = {
  post: function (data, isForced) {
    if (isForced || this.itemCount - this.postedItemCount > defs.maxLoaderPostCount && this.prevPostingDate + defs.maxLoaderPostDelay < Date.now()) {
      this.prevPostingDate = Date.now();
      postMessage(data);
      return true;
    }
    return false;
  },

  postRoadNodes: function (isForced) {
    const data = {
      message: "roadNodesLoaded",
      vertexArr: sliceFloat32Array(this.vertexArr, this.vertexOffset * 2, this.vertexCount * 2),
      roadNodeIndexArr: sliceUint32Array(this.roadNodeIndexArr, this.roadNodeIndexOffset, this.roadNodeIndexCount),
      roadNodes: this.roadNodes
    };
    if (this.post(data, isForced)) {
      this.postedItemCount += this.roadNodes.length;
      this.vertexOffset = this.vertexCount;
      this.roadNodeIndexOffset = this.roadNodeIndexCount;
      this.roadNodes = [];
    }
  },

  postRoadLinks: function (isForced) {
    const data = {
      message: "roadLinksLoaded",
      vertexArr: sliceFloat32Array(this.vertexArr, this.vertexOffset * 2, this.vertexCount * 2),
      roadLinkIndexArr: sliceUint32Array(this.roadLinkIndexArr, this.roadLinkIndexOffset, this.roadLinkIndexCount),
      roadLinks: this.roadLinks
    };
    if (this.post(data, isForced)) {
      this.postedItemCount += this.roadLinks.length;
      this.vertexOffset = this.vertexCount;
      this.roadLinkIndexOffset = this.roadLinkIndexCount;
      this.roadLinks = [];
    }
  },

  postRoads: function (isForced) {
    const data = {
      message: "roadsLoaded",
      roads: this.roads
    };
    if (this.post(data, isForced)) {
      this.postedItemCount += this.roads.length;
      this.roads = [];
    }
  },

  postAddresses: function (isForced) {
    const data = {
      message: "addressesLoaded",
      addresses: this.addresses
    };
    if (this.post(data, isForced)) {
      this.postedItemCount += this.addresses.length;
      this.addresses = [];
    }
  },

  loadRoadNodes: function (origin) {
    oboe(origin + "/json/roadnodes1.json.gz")
      .node("!.*", function (obj) {
          this.itemCount++;
          const p = {
            x: parseFloat(obj.point[0]),
            y: parseFloat(obj.point[1])
          };
          this.roadNodes.push({
              toid: obj.toid,
              address: null,
              roadLinks: [],
              vertexOffset: this.vertexCount,
              indexOffset: this.roadNodeIndexCount
            });
          this.roadNodeIndexArr[this.roadNodeIndexCount++] = this.vertexCount;
          this.vertexArr.set([p.x, p.y], this.vertexCount * 2);
          this.vertexCount++;
          this.postRoadNodes();
          return oboe.drop;
        }.bind(this))
      .done(function () {
          this.postRoadNodes(true);
        }.bind(this));
  },

  loadRoadLinks: function (origin, partIndex) {
    oboe(origin + "/json/roadlinks" + partIndex + ".json.gz")
      .node("!.*", function (obj) {
          this.itemCount++;
          let ps = [];
          for (let i = 0; i < obj.polyline.length / 2; i++) {
            ps.push({
                x: parseFloat(obj.polyline[2 * i]),
                y: parseFloat(obj.polyline[2 * i + 1])
              });
          }
          if (obj.polyline.length > 4) {
            ps = simplify(ps);
          }
          let vertices = [];
          for (let j = 0; j < ps.length; j++) {
            vertices.push(ps[j].x, ps[j].y);
          }
          this.roadLinks.push({
              toid: obj.toid,
              term: obj.term,
              nature: obj.nature,
              unloadedNegativeNode: obj.negativeNode,
              unloadedPositiveNode: obj.positiveNode,
              negativeNode: null,
              positiveNode: null,
              roads: [],
              pointCount: ps.length,
              vertexOffset: this.vertexCount,
              indexOffset: this.roadLinkIndexCount
            });
          for (let k = 0; k < ps.length; k++) {
            this.roadLinkIndexArr[this.roadLinkIndexCount++] = this.vertexCount + k;
            if (k !== 0 && k !== ps.length - 1) {
              this.roadLinkIndexArr[this.roadLinkIndexCount++] = this.vertexCount + k;
            }
          }
          this.vertexArr.set(vertices, this.vertexCount * 2);
          this.vertexCount += ps.length;
          this.roadLinkPointCount += ps.length;
          this.postRoadLinks();
          return oboe.drop;
        }.bind(this))
      .done(function () {
          this.postRoadLinks(true);
        }.bind(this));
  },

  loadRoads: function (origin) {
    oboe(origin + "/json/roads1.json.gz")
      .node("!.*", function (obj) {
          this.itemCount++;
          this.roads.push({
              toid: obj.toid,
              group: obj.group,
              term: obj.term,
              name: obj.name,
              unloadedLinks: obj.members,
              roadLinks: []
            });
          this.postRoads();
          return oboe.drop;
        }.bind(this))
      .done(function () {
          this.postRoads(true);
        }.bind(this));
  },

  loadAddresses: function (origin) {
    oboe(origin + "/json/addresses1.json.gz")
      .node("!.*", function (obj) {
          this.itemCount++;
          this.addresses.push({
              toid: obj.toid,
              text: obj.text
            });
          this.postAddresses();
          return oboe.drop;
        }.bind(this))
      .done(function () {
          this.postAddresses(true);
        }.bind(this));
  }
};

module.exports = GeometryLoader;
