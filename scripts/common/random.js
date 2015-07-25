'use strict';

var seedRandomGen = require('seedrandom');

var _ = module.exports = {
  uniform: seedRandomGen('', {
      state: true
    }),

  uniformsPerNormal: 3,

  normal: function () {
    var sum = 0;
    for (var i = 0; i < _.uniformsPerNormal; i += 1) {
      sum += _.uniform();
    }
    var mean = sum / _.uniformsPerNormal;
    return mean;
  }
};
