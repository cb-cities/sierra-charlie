"use strict";

function transposeMatrix(M) {
  return (
    M[0].map(function (a, x) {
        return (
          M.map(function (b, y) {
              return b[x];
            }));
      }));
}

function rotateMatrix90c(M) {
  var E = transposeMatrix(M);
  for (var x = 0; x < E.length; x++) {
    E[x].reverse();
  }
  return E;
}

function buildSpiral(width, height, index) {
  if (width < 1 || height < 1) {
    return [[]];
  }
  var a = [];
  for (var x = 0; x < width; x++) {
    a.push(index + x);
  }
  return [a].concat(rotateMatrix90c(buildSpiral(height - 1, width, index + width)));
}

module.exports = function (width, height) {
  var M = buildSpiral(width, height, 0);
  var ps = new Array(width * height);
  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      var index = M[y][x];
      ps[index] = {
        x: x,
        y: y
      };
    }
  }
  return ps;
};
