"use strict";


function PriorityQueue() {
  this.items = [];
}

PriorityQueue.prototype = {
  isEmpty: function () {
    return !this.items.length;
  },

  enqueue: function (object, priority) {
    this.items.push({
      object: object,
      priority: priority
    });
    this.bubbleUp(this.items.length - 1);
  },

  dequeue: function () {
    if (!this.items.length) {
      return undefined;
    } else {
      const result = this.items[0];
      const last = this.items.pop();
      if (this.items.length > 0) {
        this.items[0] = last;
        this.bubbleDown(0);
      }
      return result.object;
    }
  },

  peek: function () {
    return this.items[0];
  },

  bubbleUp: function (i) {
    while (i > 0) {
      const parent = (i - 1) >>> 1;
      if (this.items[i].priority < this.items[parent].priority) {
        const parentItem = this.items[parent];
        this.items[parent] = this.items[i];
        this.items[i] = parentItem;
      } else {
        break;
      }
    }
  },

  bubbleDown: function (i) {
    const last = this.items.length - 1;
    while (true) {
      let min = i;
      const left = (i << 1) + 1;
      const right = left + 1;
      if (left <= last && this.items[left].priority < this.items[min].priority) {
        min = left;
      }
      if (right <= last && this.items[right].priority < this.items[min].priority) {
        min = right;
      }
      if (min !== i) {
        const minItem = this.items[min];
        this.items[min] = this.items[i];
        this.items[i] = minItem;
        i = min;
      } else {
        break;
      }
    }
  }
};

module.exports = PriorityQueue;
