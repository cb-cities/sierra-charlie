"use strict";


var maxItems = 1;

function Quadtree(left, top, size) {
  this.left = left;
  this.top = top;
  this.size = size;
  this.items = [];
}

Quadtree.prototype = {
  split: function () {
    var halfSize = this.size / 2;
    var midWidth = this.left + halfSize;
    var midHeight = this.top + halfSize;
    this.topLeft = new Quadtree(this.left, this.top, halfSize);
    this.topRight = new Quadtree(midWidth, this.top, halfSize);
    this.bottomLeft = new Quadtree(this.left, midHeight, halfSize);
    this.bottomRight = new Quadtree(midWidth, midHeight, halfSize);
    var items = this.items;
    delete this.items;
    for (var i = 0; i < items.length; i++) {
      this.insert(items[i]);
    }
  },

  insert: function (item) {
    if (this.items) {
      if (this.items.length < maxItems) {
        this.items.push(item);
      } else {
        this.split();
        this.insert(item);
      }
    } else {
      if (this.topLeft.contains(item.p)) {
        this.topLeft.insert(item);
      } else if (this.topRight.contains(item.p)) {
        this.topRight.insert(item);
      } else if (this.bottomLeft.contains(item.p)) {
        this.bottomLeft.insert(item);
      } else if (this.bottomRight.contains(item.p)) {
        this.bottomRight.insert(item);
      }
    }
  },

  select: function (rect) {
    var results = [];
    if (this.intersects(rect)) {
      if (this.items) {
        for (var i = 0; i < this.items.length; i++) {
          if (rect.contains(this.items[i].p)) {
            results.push(this.items[i]);
          }
        }
      } else {
        results.push.apply(results, this.topLeft.select(rect));
        results.push.apply(results, this.topRight.select(rect));
        results.push.apply(results, this.bottomLeft.select(rect));
        results.push.apply(results, this.bottomRight.select(rect));
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

  intersects: function (rect) {
    return (
      this.left <= rect.right &&
      rect.left <= this.left + this.size &&
      this.top <= rect.bottom &&
      rect.top <= this.top + this.size);
  }
};

module.exports = Quadtree;
