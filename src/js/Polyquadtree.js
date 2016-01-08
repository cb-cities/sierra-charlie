"use strict";

const rect = require("./rect");


const softMaxItemCount = 16;

function Polyquadtree(left, top, size, getItemBounds) {
  this.left = left;
  this.top = top;
  this.size = size;
  this.getItemBounds = getItemBounds;
  this.items = [];
}

Polyquadtree.prototype = {
  insert: function (newItem) {
    const newBounds = this.getItemBounds(newItem);
    if (this.items) {
      if (this.items.length < softMaxItemCount || this.someItemIntersects(newBounds)) {
        this.items.push(newItem);
      } else {
        this.split();
        this.insert(newItem);
      }
    } else {
      if (this.topLeft.intersects(newBounds)) {
        this.topLeft.insert(newItem);
      }
      if (this.topRight.intersects(newBounds)) {
        this.topRight.insert(newItem);
      }
      if (this.bottomLeft.intersects(newBounds)) {
        this.bottomLeft.insert(newItem);
      }
      if (this.bottomRight.intersects(newBounds)) {
        this.bottomRight.insert(newItem);
      }
    }
  },

  someItemIntersects: function (r) {
    for (let i = 0; i < this.items.length; i++) {
      if (rect.intersects(r, this.getItemBounds(this.items[i]))) {
        return true;
      }
    }
    return false;
  },

  split: function () {
    const halfSize = this.size / 2;
    const midWidth = this.left + halfSize;
    const midHeight = this.top + halfSize;
    this.topLeft = new Polyquadtree(this.left, this.top, halfSize, this.getItemBounds);
    this.topRight = new Polyquadtree(midWidth, this.top, halfSize, this.getItemBounds);
    this.bottomLeft = new Polyquadtree(this.left, midHeight, halfSize, this.getItemBounds);
    this.bottomRight = new Polyquadtree(midWidth, midHeight, halfSize, this.getItemBounds);
    const items = this.items;
    delete this.items;
    for (let i = 0; i < items.length; i++) {
      this.insert(items[i]);
    }
  },

  select: function (r) {
    let results = [];
    if (this.intersects(r)) {
      if (this.items) {
        for (let i = 0; i < this.items.length; i++) {
          if (rect.intersects(r, this.getItemBounds(this.items[i]))) {
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
