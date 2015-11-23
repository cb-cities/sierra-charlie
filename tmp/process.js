"use strict";

var assign = require("object-assign");
var fs = require("fs");
var zlib = require("zlib");
var demoProcessor = require("./demo-processor");
var tgid = require("../src/tile-group-id");


function processTileGroup(tileGroupKey, tileGroupId, tileGroupData) {
  var tileKeys = Object.keys(tileGroupData);
  tileKeys.forEach(function (tileKey) {
      var tileData = tileGroupData[tileKey];
      var result = demoProcessor.processRoadLinks(tileData.roadLinks || [], tileData);
      tileGroupData[tileKey] = {
        roadNodes:            tileData.roadNodes || [],
        roadLinks:            result.processedRoadLinks,
        localMeanTravelTimes: result.localMeanTravelTimes
      };
    });
}

function stage1() {
  var results = {};
  var count = 0;
  console.log("stage 1");
  var fileNames = fs.readdirSync("../json-original");
  fileNames.forEach(function (fileName) {
      var inputJsonGz = fs.readFileSync("../json-original/" + fileName);
      var inputJson = zlib.gunzipSync(inputJsonGz);
      var tileGroupId = tgid.fromFileName(fileName);
      var tileGroupKey = tgid.toKey(tileGroupId);
      var tileGroupData = JSON.parse(inputJson);
      processTileGroup(tileGroupKey, tileGroupId, tileGroupData);
      results[tileGroupId] = tileGroupData;
      count++;
      console.log(count + "/" + fileNames.length + ": " + tileGroupKey);
    });
  return results;
}

function stage2(results) {
  var metaData = demoProcessor.getMetaData();
  var count = 0;
  var tileGroupIds = Object.keys(results);
  console.log("stage 2");
  if (!fs.existsSync("../json")) {
    fs.mkdirSync("../json");
  }
  tileGroupIds.forEach(function (tileGroupId) {
      var fileName = tgid.toFileName(tileGroupId);
      var tileGroupKey = tgid.toKey(tileGroupId);
      var tileGroupData = results[tileGroupId];
      assign(tileGroupData, {
          globalMeanTravelTimes:   metaData.globalMeanTravelTimes,
          maxGlobalMeanTravelTime: metaData.maxGlobalMeanTravelTime,
          maxLocalMeanTravelTime:  metaData.maxLocalMeanTravelTime
        });
      var outputJson = JSON.stringify(tileGroupData, null, 2);
      var outputJsonGz = zlib.gzipSync(outputJson);
      fs.writeFileSync("../json/" + fileName, outputJsonGz);
      count++;
      console.log(count + "/" + tileGroupIds.length + ": " + tileGroupKey);
    });
}

stage2(stage1());
