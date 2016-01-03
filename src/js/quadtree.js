"use strict";

var rect = require("./rect");


var maxItems = 16;

function Quadtree(left, top, size, getPoint) {
  this.left = left;
  this.top = top;
  this.size = size;
  this.getPoint = getPoint;
  this.items = [];
}

Quadtree.prototype = {
  insert: function (newItem) {
    if (this.items) {
      if (this.items.length < maxItems) {
        this.items.push(newItem);
      } else {
        this.split();
        this.insert(newItem);
      }
    } else {
      if (this.topLeft.contains(this.getPoint(newItem))) {
        this.topLeft.insert(newItem);
      } else if (this.topRight.contains(this.getPoint(newItem))) {
        this.topRight.insert(newItem);
      } else if (this.bottomLeft.contains(this.getPoint(newItem))) {
        this.bottomLeft.insert(newItem);
      } else if (this.bottomRight.contains(this.getPoint(newItem))) {
        this.bottomRight.insert(newItem);
      }
    }
  },

  split: function () {
    var halfSize = this.size / 2;
    var midWidth = this.left + halfSize;
    var midHeight = this.top + halfSize;
    this.topLeft = new Quadtree(this.left, this.top, halfSize, this.getPoint);
    this.topRight = new Quadtree(midWidth, this.top, halfSize, this.getPoint);
    this.bottomLeft = new Quadtree(this.left, midHeight, halfSize, this.getPoint);
    this.bottomRight = new Quadtree(midWidth, midHeight, halfSize, this.getPoint);
    var items = this.items;
    delete this.items;
    for (var i = 0; i < items.length; i++) {
      this.insert(items[i]);
    }
  },

  select: function (r) {
    var results = [];
    if (this.intersects(r)) {
      if (this.items) {
        for (var i = 0; i < this.items.length; i++) {
          if (rect.contains(r, this.getPoint(this.items[i]))) {
            results.push(this.items[i]);
          }
        }
      } else {
        results.push.apply(results, this.topLeft.select(r));
        results.push.apply(results, this.topRight.select(r));
        results.push.apply(results, this.bottomLeft.select(r));
        results.push.apply(results, this.bottomRight.select(r));
      }
    }
    return results;
  },

  fnord: function (p) {
    if (this.contains(p)) {
      if (this.items) {
        return this.items;
      } else {
        if (this.topLeft.contains(p)) {
          return this.topLeft.fnord(p);
        } else if (this.topRight.contains(p)) {
          return this.topRight.fnord(p);
        } else if (this.bottomLeft.contains(p)) {
          return this.bottomLeft.fnord(p);
        } else if (this.bottomRight.contains(p)) {
          return this.bottomRight.fnord(p);
        }
      }
    } else {
      return [];
    }
  },

  contains: function (p) {
    return (
      this.left <= p.x &&
      p.x <= this.left + this.size &&
      this.top <= p.y &&
      p.y <= this.top + this.size);
  },

  intersects: function (r) {
    return (
      this.left <= r.right &&
      r.left <= this.left + this.size &&
      this.top <= r.bottom &&
      r.top <= this.top + this.size);
  },

  extendLineset: function (lineset) {
    if (this.items) {
      lineset.extend([
          this.left, this.top,
          this.left + this.size, this.top,
          this.left, this.top + this.size,
          this.left + this.size, this.top + this.size
        ],
        this.items.length === 0 ?
          emptyLeafIndices :
          leafIndices);
    } else {
      this.topLeft.extendLineset(lineset);
      this.topRight.extendLineset(lineset);
      this.bottomLeft.extendLineset(lineset);
      this.bottomRight.extendLineset(lineset);
    }
  },

  extendStats: function (stats) {
    if (this.items) {
      stats.itemCounts.push(this.items.length);
    } else {
      stats.nodeSizes.push(this.size);
      this.topLeft.extendStats(stats);
      this.topRight.extendStats(stats);
      this.bottomLeft.extendStats(stats);
      this.bottomRight.extendStats(stats);
    }
    return stats;
  }
};

var leafIndices = [
  0, 1,
  1, 3,
  3, 2,
  2, 0
];
var emptyLeafIndices = leafIndices.concat([
  0, 3,
  1, 2
]);

module.exports = Quadtree;
