"use strict";

const GeometryLoader = require("./GeometryLoader");


const loader = new GeometryLoader();

self.onmessage = function (event) {
  const data = event.data;
  switch (data.message) {
    case "startLoading": {
      loader.loadRoadNodes(data.origin);
      loader.loadAddresses(data.origin);
      for (let i = 1; i <= 4; i++) {
        loader.loadRoadLinks(data.origin, i);
      }
      loader.loadRoads(data.origin);
      break;
    }
  }
};
