"use strict";


function UnboundedSpiral(offsetX, offsetY) {
  this.setOffset(offsetX, offsetY);
  this.layer = 0;
  this.count = 0;
}

UnboundedSpiral.prototype = {
  setOffset: function (offsetX, offsetY) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  },

  reset: function (offsetX, offsetY) {
    this.setOffset(offsetX, offsetY);
    this.layer = 0;
    this.count = 0;
  },

  next: function () {
    if (this.count <= this.layer * 2) {
      var i = this.count;
      this.count++;
      return {
        x: this.offsetX + this.layer,
        y: this.offsetY - this.layer + i
      };
    } else if (this.count <= this.layer * 4) {
      var i = this.count - this.layer * 2;
      this.count++;
      return {
        x: this.offsetX + this.layer - i,
        y: this.offsetY + this.layer
      };
    } else if (this.count <= this.layer * 6) {
      var i = this.count - this.layer * 4;
      this.count++;
      return {
        x: this.offsetX - this.layer,
        y: this.offsetY + this.layer - i
      };
    } else if (this.count <= this.layer * 8) {
      var i = this.count - this.layer * 6;
      this.count++;
      return {
        x: this.offsetX - this.layer + i,
        y: this.offsetY - this.layer
      };
    } else {
      this.layer++;
      this.count = 1;
      return this.next();
    }
  }
};

module.exports = UnboundedSpiral;
