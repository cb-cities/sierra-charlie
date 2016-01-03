"use strict";

var polyline = require("./polyline");
var rect = require("./rect");


var maxItems = 16;

function Polyquadtree(left, top, size) {
  this.left = left;
  this.top = top;
  this.size = size;
  this.items = [];
}

Polyquadtree.prototype = {
  insert: function (newItem) {
    if (this.items) {
      if (this.items.length < maxItems || this.items.some(function (item) {
          return rect.intersects(newItem.bounds, item.bounds);
        })) {
        this.items.push(newItem);
      } else {
        this.split();
        this.insert(newItem);
      }
    } else {
      if (this.topLeft.intersects(newItem.bounds)) {
        this.topLeft.insert(newItem);
      }
      if (this.topRight.intersects(newItem.bounds)) {
        this.topRight.insert(newItem);
      }
      if (this.bottomLeft.intersects(newItem.bounds)) {
        this.bottomLeft.insert(newItem);
      }
      if (this.bottomRight.intersects(newItem.bounds)) {
        this.bottomRight.insert(newItem);
      }
    }
  },

  split: function () {
    var halfSize = this.size / 2;
    var midWidth = this.left + halfSize;
    var midHeight = this.top + halfSize;
    this.topLeft = new Polyquadtree(this.left, this.top, halfSize);
    this.topRight = new Polyquadtree(midWidth, this.top, halfSize);
    this.bottomLeft = new Polyquadtree(this.left, midHeight, halfSize);
    this.bottomRight = new Polyquadtree(midWidth, midHeight, halfSize);
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
          if (rect.intersects(r, this.items[i].bounds)) {
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

module.exports = Polyquadtree;
