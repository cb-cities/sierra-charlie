"use strict";

var http = require("http-request-wrapper");

var queuedReqs = {};
var queuedReqIds = [];
var currentReqId = null;
var completedReqIds = {};

function queueRequest(req) {
  if (req.id === currentReqId || req.id in completedReqIds) {
    return;
  }
  queuedReqs[req.id] = req;
  queuedReqIds.push(req.id);
}

function performNextRequest() {
  if (currentReqId) {
    return;
  }
  var reqId;
  var req;
  while (true) {
    reqId = queuedReqIds.pop();
    if (!reqId) {
      return;
    }
    req = queuedReqs[reqId];
    if (!req) {
      return;
    }
    queuedReqs[reqId] = undefined;
    if (!(reqId in completedReqIds)) {
      break;
    }
  }
  currentReqId = reqId;
  http.getJsonResource(req.url, function (res, err) {
      if (!err || err.type === "clientError") {
        completedReqIds[reqId] = true;
        postMessage({
            gx: req.gx,
            gy: req.gy,
            id: req.id,
            roadLinks: (res && res.roadLinks) || [],
            roadNodes: (res && res.roadNodes) || []
          });
      }
      currentReqId = null;
      performNextRequest();
    });
}

onmessage = function (event) {
  switch (event.data.cmd) {
    case "queueRequest":
      queueRequest(event.data.req);
      break;
    case "performNextRequest":
      performNextRequest();
      break;
  }
};
