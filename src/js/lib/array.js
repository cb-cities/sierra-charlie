"use strict";


module.exports = {
  sliceFloat32: function (array, start, end) {
    return new Float32Array(array.buffer.slice(start * 4, end * 4));
  },

  sliceUint32: function (array, start, end) {
    return new Uint32Array(array.buffer.slice(start * 4, end * 4));
  }
};
