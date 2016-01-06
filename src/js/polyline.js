"use strict";

var rect = require("./rect");
var segment = require("./segment");


var _ = module.exports = {
  length: function (ps) {
    var result = 0;
    for (var i = 0; i < ps.length - 1; i++) {
      result += segment.length({
          p1: ps[i],
          p2: ps[i + 1]
        });
    }
    return result;
  },

  distance: function (v, ps) {
    var result = Infinity;
    for (var i = 0; i < ps.length - 1; i++) {
      var d = segment.distance(v, {
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
    var result = rect.invalid;
    for (var i = 0; i < ps.length - 1; i++) {
      result = rect.union(result, segment.bounds(margin, {
          p1: ps[i],
          p2: ps[i + 1]
        }));
    }
    return result;
  },

  approximateMidpoint: function (ps) {
    if (ps.length < 2) {
      return undefined;
    } else {
      return segment.midpoint({
          p1: ps[0],
          p2: ps[ps.length - 1]
        });
    }
  },

  intersects: function (ps1, ps2) {
    if (!rect.intersects(_.bounds(0, ps1), _.bounds(0, ps2))) {
      return false;
    } else {
      for (var i = 0; i < ps1.length - 1; i++) {
        var s1 = {
          p1: ps1[i],
          p2: ps1[i + 1]
        };
        for (var j = 0; j < ps2.length - 1; j++) {
          var s2 = {
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
