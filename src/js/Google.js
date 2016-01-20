"use strict";

const GoogleClientWorker = require("worker?inline!./GoogleClientWorker");


function Google(props) {
  this.props = props;
  this.worker = new GoogleClientWorker();
  this.worker.addEventListener("message", this.onMessage.bind(this));
}

Google.prototype = {
  requestRoute: function (toid, start, end) {
    this.worker.postMessage({
      message: "requestRoute",
      toid: toid,
      start: start,
      end: end
    });
  },

  onMessage: function (event) {
    switch (event.data.message) {
      case "routeReceived":
        this.onRouteReceived(event.data);
        break;
    }
  },

  onRouteReceived: function (data) {
    if (this.props.onRouteReceived) {
      this.props.onRouteReceived(data.toid, data.response);
    }
  }
};

module.exports = Google;
