'use strict';

var sorted1d = require('./sorted1d');

var _ = module.exports = {
  lessX: function (v, w) {
    return v.x < w.x;
  },

  lessY: function (v, w) {
    return v.y < w.y;
  },

  sortX: function (unsorted) {
    unsorted.sort(function (v, w) {
        return (v.x - w.x) || (v.y - w.y);
      });
  },

  sortY: function (unsorted) {
    unsorted.sort(function (v, w) {
        return (v.y - w.y) || (v.x - w.x);
      });
  },

  between: function (sortedX, minKey, maxKey) {
    var sortedY = sorted1d.between(sortedX, minKey, maxKey, _.lessX);
    _.sortY(sortedY);
    return sorted1d.between(sortedY, minKey, maxKey, _.lessY);
  }
};
