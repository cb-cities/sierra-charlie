"use strict";


const _ = module.exports = {
  minimum: function (arr) {
    let result = Infinity;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] < result) {
        result = arr[i];
      }
    }
    return result;
  },

  maximum: function (arr) {
    let result = -Infinity;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] > result) {
        result = arr[i];
      }
    }
    return result;
  },

  average: function (arr) {
    let result = 0;
    for (let i = 0; i < arr.length; i++) {
      result += arr[i];
    }
    return result / arr.length;
  },

  variance: function (arr) {
    const avg = _.average(arr);
    let result = 0;
    for (let i = 0; i < arr.length; i++) {
      const diff = avg - arr[i];
      result += diff * diff;
    }
    return result / arr.length;
  },

  standardDeviation: function (arr) {
    return Math.sqrt(_.variance(arr));
  },

  dump: function (arr) {
    return {
      min: _.minimum(arr),
      max: _.maximum(arr),
      avg: _.average(arr),
      std: _.standardDeviation(arr)
    };
  }
};
