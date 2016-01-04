"use strict";


var _ = module.exports = {
  minimum: function (arr) {
    var min = Infinity;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] < min) {
        min = arr[i];
      }
    }
    return min;
  },

  maximum: function (arr) {
    var max = -Infinity;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] > max) {
        max = arr[i];
      }
    }
    return max;
  },

  average: function (arr) {
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
      sum += arr[i];
    }
    return sum / arr.length;
  },

  variance: function (arr) {
    var avg = _.average(arr);
    var sum = 0;
    for (var i = 0; i < arr.length; i++) {
      var diff = avg - arr[i];
      sum += diff * diff;
    }
    return sum / arr.length;
  },

  standardDeviation: function (arr) {
    return Math.sqrt(_.variance(arr));
  }
};
