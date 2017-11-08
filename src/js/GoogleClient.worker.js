"use strict";

const GoogleClient = require("./GoogleClient");


const client = new GoogleClient();

self.onmessage = function (event) {
  const data = event.data;
  switch (data.message) {
    case "requestRoute": {
      client.requestRoute(data.toid, data.start, data.end);
      break;
    }
  }
};
