"use strict";

var oboe = require("oboe");

var defs = require("./defs");


function sliceFloat32Array(array, offset, count) {
  return new Float32Array(array.buffer.slice(offset * 4, count * 4));
}


function sliceUint32Array(array, offset, count) {
  return new Uint32Array(array.buffer.slice(offset * 4, count * 4));
}


function GeometryLoader() {
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
  this.roadLinks = [];
  this.prevPostDate = 0;
}

GeometryLoader.prototype = {
  post: function (data, isForced) {
    if (isForced || this.vertexCount - this.vertexOffset > 512 && this.prevPostDate + 100 < Date.now()) {
      this.prevPostDate = Date.now();
      postMessage(data);
      return true;
    }
    return false;
  },

  postRoadNodes: function (isForced) {
    var data = {
      message: "roadNodesLoaded",
      vertexArr: sliceFloat32Array(this.vertexArr, this.vertexOffset * 2, this.vertexCount * 2),
      roadNodeIndexArr: sliceUint32Array(this.roadNodeIndexArr, this.roadNodeIndexOffset, this.roadNodeIndexCount),
      roadNodes: this.roadNodes
    };
    if (this.post(data, isForced)) {
      this.vertexOffset = this.vertexCount;
      this.roadNodeIndexOffset = this.roadNodeIndexCount;
      this.roadNodes = [];
    }
  },

  postRoadLinks: function (isForced) {
    var data = {
      message: "roadLinksLoaded",
      vertexArr: sliceFloat32Array(this.vertexArr, this.vertexOffset * 2, this.vertexCount * 2),
      roadLinkIndexArr: sliceUint32Array(this.roadLinkIndexArr, this.roadLinkIndexOffset, this.roadLinkIndexCount),
      roadLinks: this.roadLinks
    };
    if (this.post(data, isForced)) {
      this.vertexOffset = this.vertexCount;
      this.roadLinkIndexOffset = this.roadLinkIndexCount;
      this.roadLinks = [];
    }
  },

  loadRoadNodes: function (origin) {
    oboe(origin + "/json/roadnodes.json.gz")
      .node("!.*", function (arr, path) {
          var toid = path[0];
          var p = {
            x: parseFloat(arr[0]),
            y: parseFloat(arr[1])
          };
          this.roadNodes.push({
              toid: toid,
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
      .node("!.*", function (obj, path) {
          var toid = path[0];
          var pointCount = obj.ps.length / 2;
          var ps = [];
          for (var i = 0; i < pointCount; i++) {
            ps.push({
                x: parseFloat(obj.ps[2 * i]),
                y: parseFloat(obj.ps[2 * i + 1])
              });
          }
          this.roadLinks.push({
              toid: toid,
              negativeNode: obj.neg,
              positiveNode: obj.pos,
              pointCount: pointCount,
              vertexOffset: this.vertexCount,
              indexOffset: this.roadLinkIndexCount
            });
          for (var i = 0; i < pointCount; i++) {
            this.roadLinkIndexArr[this.roadLinkIndexCount++] = this.vertexCount + i;
            if (i !== 0 && i !== pointCount - 1) {
              this.roadLinkIndexArr[this.roadLinkIndexCount++] = this.vertexCount + i;
            }
          }
          this.vertexArr.set(obj.ps, this.vertexCount * 2)
          this.vertexCount += pointCount;
          this.postRoadLinks();
          return oboe.drop;
        }.bind(this))
      .done(function () {
          this.postRoadLinks(true);
        }.bind(this));
  }
};

module.exports = GeometryLoader;
