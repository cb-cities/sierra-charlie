"use strict";


function Queue() {
  this.offset = 0;
  this.items = [];
}

Queue.prototype = {
  isEmpty: function () {
    return this.offset === this.items.length;
  },

  enqueue: function (item) {
    this.items.push(item);
  },

  dequeue: function () {
    if (this.isEmpty()) {
      return undefined;
    } else {
      const result = this.items[this.offset++];
      if (this.offset * 2 >= this.items.length) {
        this.items = this.items.slice(this.offset);
        this.offset = 0;
      }
      return result;
    }
  },

  peek: function () {
    return this.items[this.offset];
  }
};

module.exports = Queue;
