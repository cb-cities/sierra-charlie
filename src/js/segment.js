"use strict";

const vector = require("./vector");


const _ = module.exports = {
  length: function (s) {
    return vector.length(vector.subtract(s.p2, s.p1));
  },

  project: function (v, s) {
    const w = vector.subtract(s.p2, s.p1);
    const len = vector.length(w);
    const ratio =
      Math.max(0,
        Math.min(
          vector.project(
            vector.subtract(v, s.p1),
            w),
          len)) / len;
    return vector.add(vector.scale(ratio, w), s.p1);
  },

  distance: function (v, s) {
    return vector.distance(v, _.project(v, s));
  },

  bounds: function (margin, s) {
    return {
      left: Math.min(s.p1.x, s.p2.x) - margin,
      top: Math.min(s.p1.y, s.p2.y) - margin,
      right: Math.max(s.p1.x, s.p2.x) + margin,
      bottom: Math.max(s.p1.y, s.p2.y) + margin
    };
  },

  midpoint: function (s) {
    return {
      x: (s.p1.x + s.p2.x) / 2,
      y: (s.p1.y + s.p2.y) / 2
    };
  },

  contains: function (s, p) {
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

  intersects: function (s1, s2) {
    const u = vector.subtract(s1.p2, s1.p1);
    const v = vector.subtract(s2.p2, s2.p1);
    const w = vector.subtract(s1.p1, s2.p1);
    const d = vector.perpDot(u, v);
    if (Math.abs(d) < Number.EPSILON) { // s1 and s2 are parallel
      if (vector.perpDot(u, w) !== 0 || vector.perpDot(v, w) !== 0) { // s1 and s2 are not collinear
        return false;
      } else {
        // s1 and s2 are collinear or degenerate
        const du = vector.dot(u, u);
        const dv = vector.dot(v, v);
        if (du === 0 && dv === 0) { // s1 and s2 are points
          if (s1.p1 !== s2.p1) { // s1 and s2 are distinct points
            return false;
          } else { // s1 and s2 are the same point
            return true;
          }
        } else if (du === 0) { // s1 is a single point
          if (!_.contains(s2, s1.p1)) { // s1 is not inside s2
            return false;
          } else { // s1 is inside s2
            return true;
          }
        } else if (dv === 0) { // s2 is a single point
          if (!_.contains(s1, s2.p1)) { // s2 is not inside s1
            return false;
          } else { // s2 is inside s1
            return true;
          }
        } else { // s1 and s2 are collinear
          let t0, t1;
          const w2 = vector.subtract(s1.p2, s2.p1);
          if (v.x !== 0) {
            t0 = w.x / v.x;
            t1 = w2.x / v.x;
          } else {
            t0 = w.y / v.y;
            t1 = w2.y / v.y;
          }
          if (t0 > t1) {
            const t = t0;
            t0 = t1;
            t1 = t;
          }
          if (t0 > 1 || t1 < 0) { // s1 and s2 do not overlap
            return false;
          } else {
            t0 = Math.max(0, t0);
            t1 = Math.min(t1, 1);
            if (t0 === t1) { // s1 and s2 overlap in a point
              return true;
            } else { // s1 and s2 overlap in a subsegment
              return true;
            }
          }
        }
      }
    } else { // s1 and s2 may intersect in a point
      const si = vector.perpDot(v, w) / d;
      if (si < 0 || si > 1) {
        return false;
      } else {
        const ti = vector.perpDot(u, w) / d;
        if (ti < 0 || ti > 1) {
          return false;
        } else {
          return true;
        }
      }
    }
  },

  intersection: function (s1, s2) {
    const u = vector.subtract(s1.p2, s1.p1);
    const v = vector.subtract(s2.p2, s2.p1);
    const w = vector.subtract(s1.p1, s2.p1);
    const d = vector.perpDot(u, v);
    if (Math.abs(d) < Number.EPSILON) { // s1 and s2 are parallel
      if (vector.perpDot(u, w) !== 0 || vector.perpDot(v, w) !== 0) { // s1 and s2 are not collinear
        return {
          result: "none"
        };
      } else {
        // s1 and s2 are collinear or degenerate
        const du = vector.dot(u, u);
        const dv = vector.dot(v, v);
        if (du === 0 && dv === 0) { // s1 and s2 are points
          if (s1.p1 !== s2.p1) { // s1 and s2 are distinct points
            return {
              result: "none"
            };
          } else { // s1 and s2 are the same point
            return {
              result: "point",
              p: s1.p1
            };
          }
        } else if (du === 0) { // s1 is a single point
          if (!_.contains(s2, s1.p1)) { // s1 is not inside s2
            return {
              result: "none"
            };
          } else { // s1 is inside s2
            return {
              result: "point",
              p: s1.p1
            };
          }
        } else if (dv === 0) { // s2 is a single point
          if (!_.contains(s1, s2.p1)) { // s2 is not inside s1
            return {
              result: "none"
            };
          } else { // s2 is inside s1
            return {
              result: "point",
              p: s2.p1
            };
          }
        } else { // s1 and s2 are collinear
          let t0, t1;
          const w2 = vector.subtract(s1.p2, s2.p1);
          if (v.x !== 0) {
            t0 = w.x / v.x;
            t1 = w2.x / v.x;
          } else {
            t0 = w.y / v.y;
            t1 = w2.y / v.y;
          }
          if (t0 > t1) {
            const t = t0;
            t0 = t1;
            t1 = t;
          }
          if (t0 > 1 || t1 < 0) { // s1 and s2 do not overlap
            return {
              result: "none"
            };
          } else {
            t0 = Math.max(0, t0);
            t1 = Math.min(t1, 1);
            if (t0 === t1) { // s1 and s2 overlap in a point
              return {
                result: "point",
                p: vector.add(s2.p1, vector.scale(t0, v))
              };
            } else { // s1 and s2 overlap in a subsegment
              return {
                result: "segment",
                s: {
                  p1: vector.add(s2.p1, vector.scale(t0, v)),
                  p2: vector.add(s2.p1, vector.scale(t1, v))
                }
              };
            }
          }
        }
      }
    } else { // s1 and s2 may intersect in a point
      const si = vector.perpDot(v, w) / d;
      if (si < 0 || si > 1) {
        return {
          result: "none"
        };
      } else {
        const ti = vector.perpDot(u, w) / d;
        if (ti < 0 || ti > 1) {
          return {
            result: "none"
          };
        } else {
          return {
            result: "point",
            p: vector.add(s1.p1, vector.scale(si, u))
          };
        }
      }
    }
  }
};
