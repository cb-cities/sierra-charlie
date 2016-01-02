"use strict";

var vector = require("./vector");

var EPSILON = 2.220446049250313e-16;


var _ = module.exports = {
  project: function (v, s) {
    var w = vector.subtract(s.p2, s.p1);
    var l = vector.length(w);
    var a = Math.max(0, Math.min(vector.project(vector.subtract(v, s.p1), w), l)) / l;
    return vector.add(vector.multiply(a, w), s.p1);
  },

  distance: function (v, s) {
    return vector.distance(v, _.project(v, s));
  },

  bound: function (s, d) {
    return {
      p1: {
        x: Math.min(s.p1.x, s.p2.x) - d,
        y: Math.min(s.p1.y, s.p2.y) - d
      },
      p2: {
        x: Math.max(s.p1.x, s.p2.x) + d,
        y: Math.max(s.p1.y, s.p2.y) + d
      }
    };
  },

  inside: function (p, s) {
    if (s.p1.x !== s.p2.x) { // s is not vertical
      if (s.p1.x <= p.x && p.x <= s.p2.x) {
        return true;
      }
      if (s.p1.x >= p.x && p.x >= s.p2.x) {
        return true;
      }
    } else { // s is vertical
      if (s.p1.y <= p.y && p.y <= s.p2.y) {
        return true;
      }
      if (s.p1.y >= p.y && p.y >= s.p2.y) {
        return true;
      }
    }
    return false;
  },

  intersect: function (s1, s2) {
    var u = vector.subtract(s1.p2, s1.p1);
    var v = vector.subtract(s2.p2, s2.p1);
    var w = vector.subtract(s1.p1, s2.p1);
    var d = vector.perpDot(u, v);
    if (Math.abs(d) < EPSILON) { // s1 and s2 are parallel
      if (vector.perpDot(u, w) !== 0 || vector.perpDot(v, w) !== 0) { // s1 and s2 are not collinear
        return {
          result: "none"
        };
      }
      // s1 and s2 are collinear or degenerate
      var du = vector.dot(u, u);
      var dv = vector.dot(v, v);
      if (du === 0 && dv === 0) { // s1 and s2 are points
        if (s1.p1 !== s2.p1) { // s1 and s2 are distinct points
          return {
            result: "none"
          };
        }
        return { // s1 and s2 are the same point
          result: "point",
          p:      s1.p1
        };
      }
      if (du === 0) { // s1 is a single point
        if (!_.inside(s1.p1, s2)) { // s1 is not inside s2
          return {
            result: "none"
          };
        }
        return { // s1 is inside s2
          result: "point",
          p:      s1.p1
        };
      }
      if (dv === 0) { // s2 is a single point
        if (!_.inside(s2.p1, s1)) { // s2 is not inside s1
          return {
            result: "none"
          };
        }
        return { // s2 is inside s1
          result: "point",
          p:      s2.p1
        };
      }
      // s1 and s2 are collinear
      var t0, t1;
      var w2 = vector.subtract(s1.p2, s2.p1);
      if (v.x !== 0) {
        t0 = w.x / v.x;
        t1 = w2.x / v.x;
      } else {
        t0 = w.y / v.y;
        t1 = w2.y / v.y;
      }
      if (t0 > t1) {
        var t = t0;
        t0 = t1;
        t1 = t;
      }
      if (t0 > 1 || t1 < 0) {
        // s1 and s2 do not overlap
        return {
          result: "none"
        };
      }
      t0 = Math.max(0, t0);
      t1 = Math.min(t1, 1);
      if (t0 === t1) {
        // s1 and s2 overlap in a point
        return {
          result: "point",
          p:      vector.add(s2.p1, vector.multiply(t0, v))
        };
      }
      // s1 and s2 overlap in a subsegment
      return {
        result: "segment",
        s: {
          p1: vector.add(s2.p1, vector.multiply(t0, v)),
          p2: vector.add(s2.p1, vector.multiply(t1, v))
        }
      };
    }
    // s1 and s2 may intersect in a point
    var si = vector.perpDot(v, w) / d;
    if (si < 0 || si > 1) {
      return {
        result: "none"
      };
    }
    var ti = vector.perpDot(u, w) / d;
    if (ti < 0 || ti > 1) {
      return {
        result: "none"
      };
    }
    return {
      result: "point",
      p:      vector.add(s1.p1, vector.multiply(si, u))
    };
  }
};
