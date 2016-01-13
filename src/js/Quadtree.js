"use strict";

const rect = require("./lib/rect");


const maxItemCount = 16;

function Quadtree(left, top, size) {
  this.left = left;
  this.top = top;
  this.size = size;
  this.items = [];
}

Quadtree.prototype = {
  insert: function (newItem) {
    if (this.items) {
      if (this.items.length < maxItemCount) {
        this.items.push(newItem);
      } else {
        this.split();
        this.insert(newItem);
      }
    } else {
      if (this.topLeft.contains(newItem.point)) {
        this.topLeft.insert(newItem);
      } else if (this.topRight.contains(newItem.point)) {
        this.topRight.insert(newItem);
      } else if (this.bottomLeft.contains(newItem.point)) {
        this.bottomLeft.insert(newItem);
      } else if (this.bottomRight.contains(newItem.point)) {
        this.bottomRight.insert(newItem);
      }
    }
  },

  split: function () {
    const halfSize = this.size / 2;
    const midWidth = this.left + halfSize;
    const midHeight = this.top + halfSize;
    this.topLeft = new Quadtree(this.left, this.top, halfSize);
    this.topRight = new Quadtree(midWidth, this.top, halfSize);
    this.bottomLeft = new Quadtree(this.left, midHeight, halfSize);
    this.bottomRight = new Quadtree(midWidth, midHeight, halfSize);
    const items = this.items;
    delete this.items;
    for (let i = 0; i < items.length; i++) {
      this.insert(items[i]);
    }
  },

  select: function (r) {
    const results = [];
    if (this.intersects(r)) {
      if (this.items) {
        for (let i = 0; i < this.items.length; i++) {
          if (rect.contains(r, this.items[i].point)) {
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

  contains: function (p) {
    return (
      this.left <= p[0] &&
      p[0] <= this.left + this.size &&
      this.top <= p[1] &&
      p[1] <= this.top + this.size);
  },

  intersects: function (r) {
    return (
      this.left <= r.right &&
      r.left <= this.left + this.size &&
      this.top <= r.bottom &&
      r.top <= this.top + this.size);
  }
};

module.exports = Quadtree;
