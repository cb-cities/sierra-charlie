"use strict";


function getFeatureTOID(feature) {
  switch (feature.tag) {
    case "roadNode":
      return feature.roadNode.toid;
    case "roadLink":
      return feature.roadLink.toid;
    case "road":
      return feature.road.toid;
  }
  return undefined;
}


function FeatureSet() {
  this.roadNodes = {};
  this.roadLinks = {};
  this.roads = {};
  this.items = {};
  this.itemCount = 0;
}

FeatureSet.prototype = {
  isEmpty: function () {
    return !this.itemCount;
  },

  clear: function () {
    this.roadNodes = {};
    this.roadLinks = {};
    this.roads = {};
    this.items = {};
    this.itemCount = 0;
  },

  contains: function (toid) {
    return toid in this.items;
  },

  insert: function (feature) {
    const toid = getFeatureTOID(feature);
    if (toid && !(toid in this.items)) {
      switch (feature.tag) {
        case "roadNode": {
          this.roadNodes[toid] = feature;
          break;
        }
        case "roadLink": {
          this.roadLinks[toid] = feature;
          break;
        }
        case "road": {
          this.roads[toid] = feature;
          break;
        }
      }
      this.items[toid] = feature;
      this.itemCount++;
    }
  },

  delete: function (feature) {
    const toid = getFeatureTOID(feature);
    if (toid && toid in this.items) {
      switch (feature.tag) {
        case "roadNode": {
          delete this.roadNodes[toid];
          break;
        }
        case "roadLink": {
          delete this.roadLinks[toid];
          break;
        }
        case "road": {
          delete this.roads[toid];
          break;
        }
      }
      delete this.items[toid];
      this.itemCount--;
    }
  },

  getTOIDs: function () {
    return Object.keys(this.items);
  },

  getFeature: function (toid) {
    return this.items[toid];
  },

  dump: function () {
    return {
      roadNodeTOIDs: Object.keys(this.roadNodes).sort(),
      roadLinkTOIDs: Object.keys(this.roadLinks).sort(),
      roadTOIDs: Object.keys(this.roads).sort(),
      itemCount: this.itemCount
    };
  }
};

module.exports = FeatureSet;
