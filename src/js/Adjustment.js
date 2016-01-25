"use strict";


function Adjustment() {
  this.deletedFeatures = {};
}

Adjustment.prototype = {
  isEmpty: function () {
    return !Object.keys(this.deletedFeatures).length;
  },

  isRoadNodeDeleted: function (roadNode) {
    return (
      roadNode.toid in this.deletedFeatures ||
      roadNode.roadLinks.some(this.isRoadLinkDeleted.bind(this)));
  },

  isRoadLinkDeleted: function (roadLink) {
    return (
      roadLink.toid in this.deletedFeatures ||
      roadLink.roads.some(this.isRoadDeleted.bind(this)));
  },

  isRoadDeleted: function (road) {
    return road.toid in this.deletedFeatures;
  },

  isRoadNodeUndeletable: function (roadNode) {
    return roadNode.toid in this.deletedFeatures;
  },

  isRoadLinkUndeletable: function (roadLink) {
    return roadLink.toid in this.deletedFeatures;
  },

  isFeatureUndeletable: function (feature) {
    let result = false;
    switch (feature.tag) {
      case "roadNode":
        result = this.isRoadNodeUndeletable(feature.roadNode);
        break;
      case "roadLink":
        result = this.isRoadLinkUndeletable(feature.roadLink);
        break;
      case "road":
        result = this.isRoadDeleted(feature.road);
        break;
    }
    return result;
  },

  clear: function () {
    this.deletedFeatures = {};
  },

  deleteFeature: function (feature) {
    switch (feature.tag) {
      case "roadNode":
        this.deletedFeatures[feature.roadNode.toid] = feature;
        break;
      case "roadLink":
        this.deletedFeatures[feature.roadLink.toid] = feature;
        break;
      case "road":
        this.deletedFeatures[feature.road.toid] = feature;
        break;
    }
  },

  undeleteFeature: function (feature) {
    switch (feature.tag) {
      case "roadNode":
        delete this.deletedFeatures[feature.roadNode.toid];
        break;
      case "roadLink":
        delete this.deletedFeatures[feature.roadLink.toid];
        break;
      case "road":
        delete this.deletedFeatures[feature.road.toid];
        break;
    }
  },

  dump: function () {
    const deletedTOIDs = Object.keys(this.deletedFeatures);
    let deletedRoadNodeTOIDs = [];
    let deletedRoadLinkTOIDs = [];
    let deletedRoadTOIDs = [];
    for (let i = 0; i < deletedTOIDs.length; i++) {
      const feature = this.deletedFeatures[deletedTOIDs[i]];
      switch (feature.tag) {
        case "roadNode":
          deletedRoadNodeTOIDs.push(feature.roadNode.toid);
          break;
        case "roadLink":
          deletedRoadLinkTOIDs.push(feature.roadLink.toid);
          break;
        case "road":
          deletedRoadTOIDs.push(feature.road.toid);
          break;
      }
    }
    deletedRoadNodeTOIDs.sort();
    deletedRoadLinkTOIDs.sort();
    deletedRoadTOIDs.sort();
    return {
      deletedItemCount: deletedRoadNodeTOIDs.length + deletedRoadLinkTOIDs.length + deletedRoadTOIDs.length,
      deletedRoadNodeTOIDs: deletedRoadNodeTOIDs,
      deletedRoadLinkTOIDs: deletedRoadLinkTOIDs,
      deletedRoadTOIDs: deletedRoadTOIDs
    };
  }
};

module.exports = Adjustment;
