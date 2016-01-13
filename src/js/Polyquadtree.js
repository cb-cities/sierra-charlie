"use strict";

const rect = require("./lib/rect");


const softMaxItemCount = 16;

function Polyquadtree(left, top, size) {
  this.left = left;
  this.top = top;
  this.size = size;
  this.items = [];
}

Polyquadtree.prototype = {
  insert: function (newItem) {
    if (this.items) {
      if (this.items.length < softMaxItemCount || this.someItemIntersects(newItem.bounds)) {
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

  someItemIntersects: function (r) {
    for (let i = 0; i < this.items.length; i++) {
      if (rect.intersects(r, this.items[i].bounds)) {
        return true;
      }
    }
    return false;
  },

  split: function () {
    const halfSize = this.size / 2;
    const midWidth = this.left + halfSize;
    const midHeight = this.top + halfSize;
    this.topLeft = new Polyquadtree(this.left, this.top, halfSize);
    this.topRight = new Polyquadtree(midWidth, this.top, halfSize);
    this.bottomLeft = new Polyquadtree(this.left, midHeight, halfSize);
    this.bottomRight = new Polyquadtree(midWidth, midHeight, halfSize);
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
  }
};

module.exports = Polyquadtree;
