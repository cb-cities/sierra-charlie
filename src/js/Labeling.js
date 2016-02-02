"use strict";

const defs = require("./defs");


function fromNodeIndex(index) {
  return index;
}

function fromLinkIndex(index) {
  return defs.textureDataSize - index - 1;
}


function Labeling(SomeArray) {
  this._data = new SomeArray(defs.textureDataSize);
}

Labeling.prototype = {
  setNodeLabel: function (node, label) {
    this._data[fromNodeIndex(node.index)] = label;
  },

  setLinkLabel: function (link, label) {
    this._data[fromLinkIndex(link.index)] = label;
  },

  getNodeLabel: function (node) {
    return this._data[fromNodeIndex(node.index)];
  },

  getLinkLabel: function (link) {
    return this._data[fromLinkIndex(link.index)];
  },
  
  getData: function () {
    return this._data;
  },

  clear: function () {
    for (let index = 0; index < defs.maxRoadNodeCount; index++) {
      this._data[fromNodeIndex(index)] = 0;
    }
    for (let index = 0; index < defs.maxRoadLinkCount; index++) {
      this._data[fromLinkIndex(index)] = 0;
    }
  },

  copy: function (other) {
    for (let index = 0; index < defs.maxRoadNodeCount; index++) {
      const k = fromNodeIndex(index);
      this._data[k] = other._data[k];
    }
    for (let index = 0; index < defs.maxRoadLinkCount; index++) {
      const k = fromLinkIndex(index);
      this._data[k] = other._data[k];
    }
  },

  includeLabeling: function (other) {
    for (let index = 0; index < defs.maxRoadNodeCount; index++) {
      const k = fromNodeIndex(index);
      this._data[k] |= other._data[k];
    }
    for (let index = 0; index < defs.maxRoadLinkCount; index++) {
      const k = fromLinkIndex(index);
      this._data[k] |= other._data[k];
    }
  },

  includeNodes: function (other, nodes) {
    nodes.forEach((node) => {
      const k = fromNodeIndex(node.index);
      this._data[k] |= other._data[k];
    });
  },

  includeLinks: function (other, links) {
    links.forEach((link) => {
      const k = fromLinkIndex(link.index);
      this._data[k] |= other._data[k];
    });
  }
};

module.exports = Labeling;
