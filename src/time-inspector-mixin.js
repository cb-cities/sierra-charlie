"use strict";

var defs = require("./defs");


var backgroundAlpha = 0.75;

var columnCount = 24;
var columnWidth = 15;
var columnsPerLabel = 3;
var columnsPerGroup = 3;
var rowCount = 10;
var rowHeight = 30;
var rowsPerLabel = 2;
var rowsPerGroup = 2;
var marginSize = 20;
var paddingSize = 2;

var boxWidth = columnCount * columnWidth;
var boxHeight = rowCount * rowHeight;


function makeDefaultColumnLabel(x) {
  return (
    (x === 0 || x === 24) ? "midnight" :
    (x === 12) ? "noon" :
    (x % 12) + (x < 12 ? "am" : "pm"));
}

function makeDefaultRowLabel(y) {
  return (y * 100 / 10) + "%";
}


module.exports = {
  paintTIFace: function (c) {
    c.lineWidth = 1 / window.devicePixelRatio;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(boxWidth + 2 * paddingSize, 0);
    c.lineTo(boxWidth + 2 * paddingSize, boxHeight + 2 * paddingSize);
    c.lineTo(0, boxHeight + 2 * paddingSize);
    c.lineTo(0, 0);
    c.globalAlpha = backgroundAlpha;
    c.fill();
    c.globalAlpha = 1;
    c.stroke();
  },

  // TODO: Refactor
  paintTIGlobalMeans: function (c) {
    c.save();
    c.fillStyle = defs.roadLinkColor;
    c.beginPath();
    for (var x = 0; x < columnCount; x++) {
      var h = Math.floor(this.globalMeanTravelTimes[x] / this.maxGlobalMeanTravelTime * boxHeight);
      c.rect(x * columnWidth, boxHeight - h, columnWidth, h);
    }
    c.globalAlpha = 0.5;
    c.fill();
    c.restore();
  },

  paintTIGrid: function (c) {
    c.globalAlpha = 0.5;
    c.lineWidth = 1 / window.devicePixelRatio;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(boxWidth, 0);
    c.lineTo(boxWidth, boxHeight);
    c.lineTo(0, boxHeight);
    c.lineTo(0, 0);
    for (var x = 1; x < columnCount; x++) {
      if (x % columnsPerGroup === 0) {
        var w = x * columnWidth;
        c.moveTo(w, 0);
        c.lineTo(w, boxHeight);
      }
    }
    for (var y = 1; y < rowCount; y++) {
      if (y % rowsPerGroup === 0) {
        var h = y * rowHeight;
        c.moveTo(0, h);
        c.lineTo(boxWidth, h);
      }
    }
    c.stroke();
    c.lineWidth = 0.5 / window.devicePixelRatio;
    c.beginPath();
    for (var x = 1; x < columnCount; x++) {
      if (x % columnsPerGroup !== 0) {
        var w = x * columnWidth;
        c.moveTo(w, 0);
        c.lineTo(w, boxHeight);
      }
    }
    c.stroke();
    c.beginPath();
    for (var y = 1; y < rowCount; y++) {
      if (y % rowsPerGroup !== 0) {
        var h = y * rowHeight;
        c.moveTo(0, h);
        c.lineTo(boxWidth, h);
      }
    }
    c.stroke();
    c.globalAlpha = 1;
  },

  paintTICurrentTime: function (c) {
    c.lineWidth = 1 / window.devicePixelRatio;
    c.strokeRect(this.floorTimeValue * columnWidth, 0, columnWidth, boxHeight);
    var w = Math.floor(this.easedTimeValue * columnWidth * 2) / 2;
    c.beginPath();
    c.moveTo(w, 0);
    c.lineTo(w, boxHeight);
    c.lineTo(w, 0);
    var h = Math.floor(this.globalMeanTravelTimes[this.floorTimeValue] / this.maxGlobalMeanTravelTime * boxHeight);
    c.moveTo(0, boxHeight - h);
    c.lineTo(boxWidth, boxHeight - h);
    c.lineTo(0, boxHeight - h);
    c.setLineDash([2, 4]);
    c.stroke();
    c.setLineDash([]);
  },

  // TODO: Refactor
  paintLabel: function (c, label, x, y) {
    c.globalAlpha = backgroundAlpha;
    c.strokeText(label, x, y);
    c.globalAlpha = 1;
    c.fillText(label, x, y);
  },

  paintTILabels: function (c) {
    c.lineWidth = 4 / window.devicePixelRatio;
    c.font = 6 + "px " + defs.labelFont;
    c.textAlign = "center";
    c.textBaseline = "top";
    for (var x = 0; x <= columnCount; x++) {
      if (x % columnsPerLabel === 0) {
        this.paintLabel(c, makeDefaultColumnLabel(x), x * columnWidth, boxHeight + 4);
      }
    }
    c.textAlign = "right";
    c.textBaseline = "middle";
    for (var y = 0; y <= rowCount; y++) {
      if (y % rowsPerLabel === 0) {
        this.paintLabel(c, makeDefaultRowLabel(y), -4, (rowCount - y) * rowHeight);
      }
    }
    c.font = 9 + "px " + defs.labelFont;
    c.textAlign = "center";
    c.textBaseline = "bottom";
    this.paintLabel(c, makeDefaultColumnLabel(this.floorTimeValue) + "—" + makeDefaultColumnLabel(this.floorTimeValue + 1), (this.floorTimeValue + 0.5) * columnWidth, -4);
    c.textAlign = "left";
    c.textBaseline = "middle";
    var h = Math.floor(this.globalMeanTravelTimes[this.floorTimeValue] / this.maxGlobalMeanTravelTime * boxHeight);
    this.paintLabel(c, Math.round(h * 100 / 10 / rowHeight) + "%", boxWidth + 4, boxHeight - h);
  },

  paintTimeInspector: function (c) {
    c.save();
    c.fillStyle = defs.backgroundColor;
    c.strokeStyle = defs.borderColor;
    c.translate(marginSize, this.state.clientHeight - boxHeight - 2 * paddingSize - marginSize);
    this.paintTIFace(c);
    c.fillStyle = defs.inverseBackgroundColor;
    c.strokeStyle = defs.inverseBackgroundColor;
    c.translate(paddingSize, paddingSize);
    this.paintTIGlobalMeans(c);
    this.paintTIGrid(c);
    this.paintTICurrentTime(c);
    c.fillStyle = defs.inverseBackgroundColor;
    c.strokeStyle = defs.backgroundColor;
    this.paintTILabels(c);
    c.restore();
  }
};
