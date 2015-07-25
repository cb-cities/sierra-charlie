'use strict';

var _ = module.exports = {
  less: function (a, b) {
    return a < b;
  },

  leastGreaterEqual: function (sorted, key, less) {
    less = less || _.less;
    function loop(min, max) {
      if (max < min || less(sorted[max], key)) {
        return -1;
      }
      if (less(key, sorted[min])) {
        return min;
      }
      if (min === max) {
        return min;
      }
      var mid = min + Math.floor((max - min) / 2);
      if (less(sorted[mid], key)) {
        return loop(mid + 1, max);
      } else {
        return loop(min, mid);
      }
    }
    return loop(0, sorted.length - 1);
  },

  greatestLesserEqual: function (sorted, key, less) {
    less = less || _.less;
    function loop(min, max) {
      if (max < min || less(key, sorted[min])) {
        return -1;
      }
      if (less(sorted[max], key)) {
        return max;
      }
      if (min === max) {
        return min;
      }
      var mid = min + Math.ceil((max - min) / 2);
      if (less(key, sorted[mid])) {
        return loop(min, mid - 1);
      } else {
        return loop(mid, max);
      }
    }
    return loop(0, sorted.length - 1);
  },

  between: function (sorted, minKey, maxKey, less) {
    less = less || _.less;
    var min = _.leastGreaterEqual(sorted, minKey, less);
    if (min === -1) {
      return [];
    }
    var max = _.greatestLesserEqual(sorted, maxKey, less);
    if (max === -1) {
      return [];
    }
    return sorted.slice(min, max + 1);
  }
};
