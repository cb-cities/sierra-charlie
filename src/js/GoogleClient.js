"use strict";

const nnng = require("nnng");
const oboe = require("oboe");


const routeKey = "AIzaSyCCyg4GqKnZ5X9BCafg83BVx2uWTWc2nMc"; // TODO
const routeOrigin = "http://localhost:4000/https://maps.googleapis.com/maps/api/directions/json";

function GoogleClient() {
}

GoogleClient.prototype = {
  requestRoute: function (toid, start, end) {
    const origin = nnng.from(start[0], start[1]); // TOOD
    const originLng = origin[1];
    const originLat = origin[0];
    const destination = nnng.from(end[0], end[1]); // TODO
    const destinationLng = destination[1];
    const destinationLat = destination[0];
    const url = (routeOrigin +
      "?origin=" + originLat + "," + originLng +
      "&destination=" + destinationLat + "," + destinationLng +
      "&key=" + routeKey);
    oboe(url)
      .done(function (response) {
          postMessage({
            message: "routeReceived",
            toid: toid,
            response: response
          });
      });
  }
};

module.exports = GoogleClient;
