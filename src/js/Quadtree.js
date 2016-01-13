"use strict";

const rect = require("./lib/rect");


const maxItemCount = 16;

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
      if (this.items.length < maxItemCount) {
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
    const halfSize = this.size / 2;
    const midWidth = this.left + halfSize;
    const midHeight = this.top + halfSize;
    this.topLeft = new Quadtree(this.left, this.top, halfSize, this.getPoint);
    this.topRight = new Quadtree(midWidth, this.top, halfSize, this.getPoint);
    this.bottomLeft = new Quadtree(this.left, midHeight, halfSize, this.getPoint);
    this.bottomRight = new Quadtree(midWidth, midHeight, halfSize, this.getPoint);
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
  }
};

module.exports = Quadtree;
