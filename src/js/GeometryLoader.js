"use strict";

const oboe = require("oboe");
const simplify = require("simplify-js");
const titlecase = require("titlecase");

const array = require("./lib/array");
const defs = require("./defs");
const polyline = require("./lib/polyline");


function makePenalty(nature, term) {
  let penalty = 1;
  switch (nature) {
    case "Dual Carriageway":
      break;
    case "Single Carriageway":
    case "Slip Road":
      penalty += 0.25;
      break;
    case "Roundabout":
    case "Traffic Island Link":
    case "Traffic Island Link At Junction":
    case "Enclosed Traffic Area Link":
    /* falls through */
    default:
      penalty += 0.5;
  }
  switch (term) {
    case "Motorway":
    case "A Road":
      break;
    case "B Road":
      penalty += 0.125;
      break;
    case "Minor Road":
    case "Local Street":
      penalty += 0.25;
      break;
    case "Private Road - Publicly Accessible":
    case "Private Road - Restricted Access":
    case "Alley":
    case "Pedestrianised Street":
    /* falls through */
    default:
      penalty += 0.5;
  }
  return penalty;
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
    const postingDelay = Date.now() - this.prevPostingDate;
    const postingCount = this.itemCount - this.postedItemCount;
    if (isForced ||
        postingCount > defs.maxLoaderPostingCount ||
        (postingDelay > defs.maxLoaderPostingDelay && postingCount > defs.minLoaderPostingCount)) {
      this.prevPostingDate = Date.now();
      postMessage(data);
      return true;
    }
    return false;
  },

  postRoadNodes: function (isForced) {
    const data = {
      message: "roadNodesLoaded",
      vertexArr: array.sliceFloat32(this.vertexArr, this.vertexOffset * 2, this.vertexCount * 2),
      roadNodeIndexArr: array.sliceUint32(this.roadNodeIndexArr, this.roadNodeIndexOffset, this.roadNodeIndexCount),
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
      vertexArr: array.sliceFloat32(this.vertexArr, this.vertexOffset * 2, this.vertexCount * 2),
      roadLinkIndexArr: array.sliceUint32(this.roadLinkIndexArr, this.roadLinkIndexOffset, this.roadLinkIndexCount),
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
          this.roadNodes.push({
              index: obj.index,
              toid: obj.toid,
              point: obj.point,
              address: null,
              roadLinks: [],
              vertexOffset: this.vertexCount,
              indexOffset: this.roadNodeIndexCount
            });
          this.roadNodeIndexArr[this.roadNodeIndexCount++] = this.vertexCount;
          this.vertexArr.set(obj.point, this.vertexCount * 2);
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
                x: obj.polyline[i * 2],
                y: obj.polyline[i * 2 + 1]
              });
          }
          if (obj.polyline.length > 4) {
            ps = simplify(ps);
          }
          const vertices = [];
          for (let j = 0; j < ps.length; j++) {
            vertices.push(ps[j].x, ps[j].y);
          }
          this.roadLinks.push({
              index: obj.index,
              toid: obj.toid,
              bounds: polyline.bounds(0, vertices),
              length: polyline.length(vertices),
              penalty: makePenalty(obj.nature, obj.term),
              term: obj.term,
              nature: obj.nature,
              negativeNodeTOID: obj.negativeNode,
              positiveNodeTOID: obj.positiveNode,
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
              index: obj.index,
              toid: obj.toid,
              group: obj.group,
              term: obj.term || null,
              name: titlecase(obj.name.toLowerCase()).replace(/\(m\)/, "(M)"),
              roadLinkTOIDs: obj.members,
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
    oboe(origin + "/json/addresses.json.gz")
      .node("!.*", function (obj) {
          this.itemCount++;
          this.addresses.push({
              toid: obj.toid,
              text: obj.text.replace(/, UK$/, "")
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
