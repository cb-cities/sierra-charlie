"use strict";


function Adjustment() {
  this.deletedFeatures = {};
}

Adjustment.prototype = {
  isRoadNodeDeleted: function (roadNode) {
    return (
      roadNode.toid in this.deletedFeatures ||
      roadNode.roadLinks.some(this.isRoadLinkDeleted.bind(this)));
  },

  isRoadLinkDeleted: function (roadLink) {
    return roadLink.toid in this.deletedFeatures;
  },
  
  isRoadNodeUndeletable: function (roadNode) {
    return roadNode.toid in this.deletedFeatures;
  },
  
  deleteFeature: function (feature) {
    switch (feature.tag) {
      case "roadNode": {
        this.deletedFeatures[feature.roadNode.toid] = feature;
        break;
      }
      case "roadLink": {
        this.deletedFeatures[feature.roadLink.toid] = feature;
        break;
      }
    }
  },
  
  undeleteFeature: function (feature) {
    switch (feature.tag) {
      case "roadNode": {
        delete this.deletedFeatures[feature.roadNode.toid];
        break;
      }
      case "roadLink": {
        delete this.deletedFeatures[feature.roadLink.toid];
        break;
      }
    }
  }
};

module.exports = Adjustment;
