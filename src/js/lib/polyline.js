"use strict";

const rect = require("./rect");
const segment = require("./segment");


const _ = module.exports = {
  length: function (ps) {
    let result = 0;
    for (let i = 0; i < ps.length - 1; i++) {
      result += segment.length({
          p1: ps[i],
          p2: ps[i + 1]
        });
    }
    return result;
  },

  distance: function (v, ps) {
    let result = Infinity;
    for (let i = 0; i < ps.length - 1; i++) {
      const d = segment.distance(v, {
          p1: ps[i],
          p2: ps[i + 1]
        });
      if (d < result) {
        result = d;
      }
    }
    return result;
  },

  bounds: function (margin, ps) {
    let result = rect.invalid;
    for (let i = 0; i < ps.length; i++) {
      result = rect.stretch(result, ps[i]);
    }
    return rect.bounds(margin, result);
  },

  midpoint: function (ps) {
    return rect.midpoint(_.bounds(0, ps));
  }
};
