"use strict";


var _ = module.exports = {
  minimum: function (arr) {
    var m = Infinity;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] < m) {
        m = arr[i];
      }
    }
    return m;
  },

  maximum: function (arr) {
    var m = -Infinity;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] > m) {
        m = arr[i];
      }
    }
    return m;
  },

  average: function (arr) {
    var s = 0;
    for (var i = 0; i < arr.length; i++) {
      s += arr[i];
    }
    return s / arr.length;
  },

  variance: function (arr) {
    var a = _.average(arr);
    var s = 0;
    for (var i = 0; i < arr.length; i++) {
      var d = a - arr[i];
      s += d * d;
    }
    return s / arr.length;
  },

  standardDeviation: function (arr) {
    return Math.sqrt(_.variance(arr));
  },

  dump: function (arr) {
    return (
      "min: " + _.minimum(arr).toFixed(2) +
      "\nmax: " + _.maximum(arr).toFixed(2) +
      "\navg: " + _.average(arr).toFixed(2) +
      "\nstd: " + _.standardDeviation(arr).toFixed(2));
  }
};
