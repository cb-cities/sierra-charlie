"use strict";

const GeometryLoader = require("./GeometryLoader");
const json_count = 8;

const loader = new GeometryLoader();

self.onmessage = function (event) {
  const data = event.data;
  switch (data.message) {
    case "startLoading": {
      loader.loadRoadNodes(data.origin);
      loader.loadAddresses(data.origin);
      for (let i = 1; i <= json_count; i++) {
        loader.loadRoadLinks(data.origin, i);
      }
      loader.loadRoads(data.origin);
      break;
    }
  }
};
