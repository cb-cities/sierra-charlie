"use strict";


const _ = module.exports = {
  exportRoadNode: function (roadNode) {
    return !roadNode ? null : {
      toid: roadNode.toid,
      address: roadNode.address,
      roadLinkTOIDs: roadNode.roadLinks.map(function (roadLink) {
          return roadLink.toid;
        })
    };
  },

  exportRoadLink: function (roadLink) {
    return !roadLink ? null : {
      toid: roadLink.toid,
      term: roadLink.term,
      nature: roadLink.nature,
      negativeNodeTOID: !roadLink.negativeNode ? null : roadLink.negativeNode.toid,
      positiveNodeTOID: !roadLink.positiveNode ? null : roadLink.positiveNode.toid,
      roads: roadLink.roads.map(_.exportRoad)
    };
  },

  exportRoad: function (road) {
    return !road ? null : {
      toid: road.toid,
      group: road.group,
      term: road.term,
      name: road.name,
      roadLinkTOIDs: road.roadLinks.map(function (roadLink) {
          return roadLink.toid;
        })
    };
  },

  exportFeature: function (feature) {
    return !feature ? null : {
      tag: feature.tag,
      roadNode: _.exportRoadNode(feature.roadNode),
      roadLink: _.exportRoadLink(feature.roadLink),
      road: _.exportRoad(feature.road)
    };
  }
};
