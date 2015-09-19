"use strict";

var http = require("http-request-wrapper");
var assign = require("object-assign");
var simplify = require("simplify-js");

var MAX_BUSY_REQ_COUNT = 1;

var queuedTileIds = [];
var waitingReqs = {};
var busyReqs = {};
var busyReqCount = 0;
var loadedReqs = {};

function queueRequest(req) {
  if (req.tileId in busyReqs || req.tileId in loadedReqs) {
    return;
  }
  if (waitingReqs[req.tileId]) {
    queuedTileIds.splice(queuedTileIds.indexOf(req.tileId), 1);
  }
  waitingReqs[req.tileId] = req;
  queuedTileIds.push(req.tileId);
}

function getNextRequest() {
  if (!queuedTileIds.length || busyReqCount >= MAX_BUSY_REQ_COUNT) {
    return undefined;
  }
  var tileId = queuedTileIds.pop();
  var req = waitingReqs[tileId];
  waitingReqs[tileId] = undefined;
  busyReqs[tileId] = req;
  busyReqCount++;
  return req;
}

function sendNextRequest() {
  var req = getNextRequest();
  if (!req) {
    return;
  }
  var tileExt = process.env.NODE_ENV === "production" ? ".json.gz" : ".json";
  var tileUrl = req.origin + "/json/" + req.tileId + tileExt;
  http.getJsonResource(tileUrl, function (tileData, err) {
      if (err && err.type === "clientError") {
        tileData = {};
      }
      if (tileData) {
        tweakTileData(tileData);
        postMessage({
            gx: req.gx,
            gy: req.gy,
            tileId: req.tileId,
            tileData: tileData
          });
      }
      // TODO: Retry transient failures.
      busyReqs[req.tileId] = undefined;
      busyReqCount--;
      loadedReqs[req.tileId] = true;
      sendNextRequest();
    });
}

function tweakTileData(tileData) {
  var roadLinks = [];
  for (var i = 0; i < (tileData.roadLinks || []).length; i++) {
    var l = tileData.roadLinks[i];
    if (l.ps.length > 1) {
      roadLinks.push(assign({}, l, {
          ps: simplify(l.ps, 2)
        }));
    }
  }
  tileData.roadLinks = roadLinks;
  tileData.roadNodes = tileData.roadNodes || [];
}

onmessage = function (event) {
  queueRequest(event.data);
  sendNextRequest();
};
