"use strict";

var GeometryLoader = require("./GeometryLoader");


var loader = new GeometryLoader();

onmessage = function (event) {
  switch (event.data.message) {
    case "startLoading":
      loader.loadRoadNodes(event.data.origin);
      for (var i = 1; i <= 4; i++) {
        loader.loadRoadLinks(event.data.origin, i);
      }
      break;
  }
};
