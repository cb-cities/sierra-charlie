"use strict";

var defs = require("./defs");


module.exports = {
  paintClockFace: function (c) {
    c.lineWidth = 1 / window.devicePixelRatio;
    c.beginPath();
    c.arc(0, 0, defs.clockSize, 0, 2 * Math.PI);
    c.globalAlpha = 0.75;
    c.fill();
    c.globalAlpha = 1;
    c.stroke();
  },

  paintClockBrand: function (c) {
    c.font = 6 + "px " + defs.labelFont;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("sierra charlie", 0, -(defs.clockSize / 2));
  },

  paintClockAmPmLabel: function (c) {
    c.font = 9 + "px " + defs.labelFont;
    c.textAlign = "right";
    c.textBaseline = "middle";
    c.fillText(this.easedTimeValue < 12 ? "am" : "pm", defs.clockSize - 20, 0);
  },

  paintClockMinuteMarks: function (c) {
    c.save();
    c.beginPath();
    for (var i = 0; i < 60; i++) {
      c.moveTo(defs.clockSize - 8, 0);
      c.lineTo(defs.clockSize - 4, 0);
      c.rotate(2 * Math.PI / 60);
    }
    c.lineWidth = 1.5;
    c.stroke();
    c.restore();
  },

  paintClockHourMarks: function (c) {
    c.save();
    c.beginPath();
    for (var i = 0; i < 12; i++) {
      c.moveTo(defs.clockSize - 16, 0);
      c.lineTo(defs.clockSize - 4, 0);
      c.rotate(2 * Math.PI / 12);
    }
    c.lineWidth = 3;
    c.stroke();
    c.restore();
  },

  paintClockHourHand: function (c) {
    c.save();
    c.rotate(this.easedTimeValue * (2 * Math.PI / 12));
    c.beginPath();
    c.moveTo(0, 16);
    c.lineTo(0, -(defs.clockSize - 20));
    c.lineWidth = 6;
    c.stroke();
    c.restore();
  },

  paintClockMinuteHand: function (c) {
    c.save();
    c.rotate((this.easedTimeValue - this.floorTimeValue) * 2 * Math.PI);
    c.beginPath();
    c.moveTo(0, 14);
    c.lineTo(0, -(defs.clockSize - 4));
    c.lineWidth = 4.5;
    c.stroke();
    c.restore();
  },

  paintClock: function (c) {
    c.save();
    c.fillStyle = defs.backgroundColor;
    c.strokeStyle = defs.borderColor;
    c.translate(this.state.clientWidth / 2, defs.clockSize + 8);
    this.paintClockFace(c);
    c.fillStyle = defs.inverseBackgroundColor;
    c.strokeStyle = defs.inverseBackgroundColor;
    this.paintClockBrand(c);
    this.paintClockAmPmLabel(c);
    this.paintClockHourMarks(c);
    this.paintClockMinuteMarks(c);
    this.paintClockHourHand(c);
    this.paintClockMinuteHand(c);
    c.restore();
  }
};
