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
    for (let i = 0; i < ps.length - 1; i++) {
      result = rect.union(result, segment.bounds(margin, {
          p1: ps[i],
          p2: ps[i + 1]
        }));
    }
    return result;
  },

  midpoint: function (ps) {
    return rect.midpoint(_.bounds(0, ps));
  },

  intersects: function (ps1, ps2) {
    if (!rect.intersects(_.bounds(0, ps1), _.bounds(0, ps2))) {
      return false;
    } else {
      for (let i = 0; i < ps1.length - 1; i++) {
        const s1 = {
          p1: ps1[i],
          p2: ps1[i + 1]
        };
        for (let j = 0; j < ps2.length - 1; j++) {
          const s2 = {
            p1: ps2[j],
            p2: ps2[j + 1]
          };
          if (segment.intersects(s1, s2)) {
            return true;
          }
        }
      }
      return false;
    }
  }
};
