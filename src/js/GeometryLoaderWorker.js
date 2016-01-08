"use strict";

const GeometryLoader = require("./GeometryLoader");


const loader = new GeometryLoader();

self.onmessage = function (event) {
  switch (event.data.message) {
    case "startLoading":
      loader.loadRoadNodes(event.data.origin);
      for (let i = 1; i <= 4; i++) {
        loader.loadRoadLinks(event.data.origin, i);
      }
      loader.loadRoads(event.data.origin);
      loader.loadAddresses(event.data.origin);
      break;
  }
};
