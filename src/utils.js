"use strict";

module.exports = {
  generate: function (count, generator) {
    var result = new Array(count);
    for (var i = 0; i < count; i += 1) {
      result[i] = generator(i);
    }
    return result;
  },

  copyElements: function () {
    var result = [];
    for (var i = 0; i < arguments.length; i += 1) {
      arguments[i].forEach(function (element) {
          result.push(element);
        });
    }
    return result;
  },

  copyUniqueElements: function () {
    var unique = {};
    for (var i = 0; i < arguments.length; i += 1) {
      arguments[i].forEach(function (element) {
          unique[element] = element;
        });
    }
    var result = [];
    Object.keys(unique).forEach(function (key) {
        result.push(unique[key]);
      });
    result.sort();
    return result;
  }
};
