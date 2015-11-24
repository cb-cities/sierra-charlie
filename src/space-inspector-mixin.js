"use strict";

var defs = require("./defs");
var iid = require("./image-id");
var tid = require("./tile-id");


var columnCount = defs.tileXCount;
var columnWidth = 5;
var columnsPerGroup = 10;
var rowCount = defs.tileYCount;
var rowHeight = 5;
var rowsPerGroup = 10;
var marginSize = 20;
var paddingSize = 2;

var boxWidth = columnCount * columnWidth;
var boxHeight = rowCount * rowHeight;


module.exports = {
  paintSIFace: function (c) {
    c.lineWidth = 1 / window.devicePixelRatio;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(boxWidth + 2 * paddingSize, 0);
    c.lineTo(boxWidth + 2 * paddingSize, boxHeight + 2 * paddingSize);
    c.lineTo(0, boxHeight + 2 * paddingSize);
    c.lineTo(0, 0);
    c.globalAlpha = 0.75;
    c.fill();
    c.globalAlpha = 1;
    c.stroke();
  },

  // TODO: Refactor
  paintSILocalMeans: function (c) {
    c.save();
    c.translate(0.5 / window.devicePixelRatio, 0.5 / window.devicePixelRatio);
    for (var x = 0; x < columnCount; x++) {
      for (var y = 0; y < rowCount; y++) {
        var tileId = tid.fromLocal(x, y);
        var tileData = this.getLoadedTile(tileId);
        if (tileData) {
          var imageId = iid.fromTileId(tileId, this.floorTimeValue, this.floorZoomPower);
          var z = tileData.localMeanTravelTimes[this.floorTimeValue] / this.maxLocalMeanTravelTime;
          c.fillStyle = this.getMeanColor(z);
          c.globalAlpha = this.getRenderedImage(imageId) ? 1 : 0.5;
          c.fillRect(x * columnWidth, y * rowHeight, columnWidth, rowHeight);
        }
      }
    }
    c.globalAlpha = 1;
    c.restore();
  },

  paintSIGrid: function (c) {
    c.lineWidth = 0.5 / window.devicePixelRatio;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(boxWidth, 0);
    c.lineTo(boxWidth, boxHeight);
    c.lineTo(0, boxHeight);
    c.lineTo(0, 0);
    for (var x = 1; x < columnCount; x++) {
      if (defs.localToTileX(x) % columnsPerGroup === 0) {
        var w = x * columnWidth;
        c.moveTo(w, 0);
        c.lineTo(w, boxHeight);
      }
    }
    for (var y = 1; y < rowCount; y++) {
      if (defs.localToTileY(y) % rowsPerGroup === 0) {
        var h = y * rowHeight;
        c.moveTo(0, h);
        c.lineTo(boxWidth, h);
      }
    }
    c.globalAlpha = 0.5;
    c.stroke();
    c.globalAlpha = 1;
  },

  paintSICurrentSpace: function (c) {
    c.lineWidth = 1 / window.devicePixelRatio;
    c.strokeRect(this.firstVisibleLocalX * columnWidth, this.firstVisibleLocalY * rowHeight, (this.lastVisibleLocalX - this.firstVisibleLocalX + 1) * columnWidth, (this.lastVisibleLocalY - this.firstVisibleLocalY + 1) * rowHeight);
    c.beginPath();
    var w = Math.floor(this.easedAttentionLeft * boxWidth * 2) / 2;
    c.moveTo(w, 0);
    c.lineTo(w, boxHeight);
    c.lineTo(w, 0);
    var h = Math.floor(this.easedAttentionTop * boxHeight * 2) / 2;
    c.moveTo(0, h);
    c.lineTo(boxWidth, h);
    c.lineTo(0, h);
    c.globalAlpha = 0.75;
    c.setLineDash([2, 4]);
    c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 1;
  },

  paintSILabels: function (c) {
    c.lineWidth = 4 / window.devicePixelRatio;
    c.font = 6 + "px " + defs.labelFont;
    c.textAlign = "center";
    c.textBaseline = "top";
    for (var x = 0; x <= columnCount; x++) {
      var tx = defs.localToTileX(x);
      if (tx % columnsPerGroup === 0) {
        this.paintLabel(c, tx + "n", x * columnWidth, boxHeight + 4);
      }
    }
    c.textAlign = "left";
    c.textBaseline = "middle";
    for (var y = 0; y <= rowCount; y++) {
      var ty = defs.localToTileY(y);
      if (ty % rowsPerGroup === 0) {
        this.paintLabel(c, ty + "e", boxWidth + 4, y * rowHeight);
      }
    }
    c.font = 9 + "px " + defs.labelFont;
    c.textAlign = "center";
    c.textBaseline = "bottom";
    this.paintLabel(c, defs.localToTileX(this.firstVisibleLocalX) + "n—" + defs.localToTileX(this.lastVisibleLocalX) + "n", this.easedAttentionLeft * boxWidth, -4);
    c.textAlign = "right";
    c.textBaseline = "middle";
    this.paintLabel(c, defs.localToTileY(this.firstVisibleLocalY) + "e—" + defs.localToTileY(this.lastVisibleLocalY) + "e", -4, this.easedAttentionTop * boxHeight);
  },

  paintSpaceInspector: function (c) {
    c.save();
    c.fillStyle = defs.backgroundColor;
    c.strokeStyle = defs.borderColor;
    c.translate(this.state.clientWidth - boxWidth - 2 * paddingSize - marginSize, this.state.clientHeight - boxHeight - 2 * paddingSize - marginSize);
    this.paintSIFace(c);
    c.fillStyle = defs.inverseBackgroundColor;
    c.strokeStyle = defs.inverseBackgroundColor;
    c.translate(paddingSize, paddingSize);
    this.paintSILocalMeans(c);
    this.paintSIGrid(c);
    this.paintSICurrentSpace(c);
    c.fillStyle = defs.inverseBackgroundColor;
    c.strokeStyle = defs.backgroundColor;
    this.paintSILabels(c);
    c.restore();
  }
};
