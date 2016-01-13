"use strict";

const rect = require("./rect");
const segment = require("./segment");


const _ = module.exports = {
  length: function (vertices) {
    const pointCount = vertices.length / 2;
    let result = 0;
    for (let i = 0; i < pointCount - 1; i++) {
      result += segment.length([
          [vertices[2 * i], vertices[2 * i + 1]],
          [vertices[2 * (i + 1)], vertices[2 * (i + 1) + 1]]
        ]);
    }
    return result;
  },

  distance: function (v, vertices) {
    const pointCount = vertices.length / 2;
    let result = Infinity;
    for (let i = 0; i < pointCount - 1; i++) {
      const d = segment.distance(v, [
          [vertices[2 * i], vertices[2 * i + 1]],
          [vertices[2 * (i + 1)], vertices[2 * (i + 1) + 1]]
        ]);
      if (d < result) {
        result = d;
      }
    }
    return result;
  },

  bounds: function (margin, vertices) {
    const pointCount = vertices.length / 2;
    let result = rect.invalid;
    for (let i = 0; i < pointCount; i++) {
      result = rect.stretch(result, [vertices[2 * i], vertices[2 * i + 1]]); // FIXME
    }
    return rect.bounds(margin, result);
  },

  midpoint: function (vertices) {
    return rect.midpoint(_.bounds(0, vertices));
  }
};
