"use strict";

const FeatureSet = require("./FeatureSet");


function Adjustment() {
  this.deletedFeatures = new FeatureSet();
}

Adjustment.prototype = {
  isEmpty: function () {
    return this.deletedFeatures.isEmpty();
  },

  clear: function () {
    this.deletedFeatures.clear();
  },

  isRoadNodeDeleted: function (roadNode) {
    return (
      this.deletedFeatures.contains(roadNode.toid) ||
      roadNode.roadLinks.some(this.isRoadLinkDeleted.bind(this)));
  },

  isRoadLinkDeleted: function (roadLink) {
    return (
      this.deletedFeatures.contains(roadLink.toid) ||
      roadLink.roads.some(this.isRoadDeleted.bind(this)));
  },

  isRoadDeleted: function (road) {
    return this.deletedFeatures.contains(road.toid);
  },

  isRoadNodeUndeletable: function (roadNode) {
    return this.deletedFeatures.contains(roadNode.toid);
  },

  isRoadLinkUndeletable: function (roadLink) {
    return this.deletedFeatures.contains(roadLink.toid);
  },

  isRoadUndeletable: function (road) {
    return this.deletedFeatures.contains(road.toid);
  },

  isFeatureUndeletable: function (feature) {
    switch (feature.tag) {
      case "roadNode":
        return this.isRoadNodeUndeletable(feature.roadNode);
      case "roadLink":
        return this.isRoadLinkUndeletable(feature.roadLink);
      case "road":
        return this.isRoadUndeletable(feature.road);
    }
    return false;
  },

  deleteFeature: function (feature) {
    this.deletedFeatures.insert(feature);
  },

  undeleteFeature: function (feature) {
    this.deletedFeatures.delete(feature);
  },

  getDeletedTOIDs: function () {
    return this.deletedFeatures.getTOIDs();
  },

  getDeletedFeature: function (toid) {
    return this.deletedFeatures.getFeature(toid);
  },

  dump: function () {
    const deletedFeatures = this.deletedFeatures.dump();
    return {
      deletedFeatures: deletedFeatures,
      itemCount: deletedFeatures.itemCount
    };
  }
};

module.exports = Adjustment;
