"use strict";

var Bounds = require("./bounds");


var maxCount = 1;

function Quadtree(size, startX, startY) {
  this.size = size;
  this.bounds = new Bounds(startX, startX + size, startY, startY + size);
  this.points = [];
}

Quadtree.prototype = {
  split: function () {
    var halfSize = Math.ceil(this.size / 2);
    this.pivotX = this.bounds.startX + halfSize;
    this.pivotY = this.bounds.startY + halfSize;
    this.topLeft     = new Quadtree(halfSize, this.bounds.startX, this.bounds.startY);
    this.bottomLeft  = new Quadtree(halfSize, this.bounds.startX, this.pivotY);
    this.topRight    = new Quadtree(halfSize, this.pivotX, this.bounds.startY);
    this.bottomRight = new Quadtree(halfSize, this.pivotX, this.pivotY);
    var points = this.points;
    delete this.points;
    for (var i = 0; i < points.length; i++) {
      this.insert(points[i]);
    }
  },

  insert: function (point) {
    if (this.points) {
      if (this.points.length < maxCount) {
        this.points.push(point);
      } else {
        this.split();
        this.insert(point);
      }
    } else {
      var target = (
        point.x < this.pivotX ? (
          point.y < this.pivotY ?
            this.topLeft :
            this.bottomLeft) : (
          point.y < this.pivotY ?
            this.topRight :
            this.bottomRight));
      target.insert(point);
    }
  },

  select: function (bounds) {
    var results = [];
    if (bounds.intersect(this.bounds)) {
      if (this.points) {
        for (var i = 0; i < this.points.length; i++) {
          var point = this.points[i];
          if (bounds.contain(point)) {
            results.push({
                x: point.x,
                y: point.y
              });
          }
        }
      } else {
        results = (
          this.topLeft.select(bounds).concat(
            this.bottomLeft.select(bounds).concat(
              this.topRight.select(bounds).concat(
                this.bottomRight.select(bounds)))));
      }
    }
    return results;
  }
};

module.exports = Quadtree;
