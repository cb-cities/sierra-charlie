"use strict";


function Indexset() {
  this.indexArr = [];
  this.indexBuf = null;
}

Indexset.prototype = {
  clear: function () {
    this.indexArr = [];
  },

  insertPoint: function (newIndex) {
    this.indexArr.push(newIndex);
  },

  insertLine: function (newIndices) {
    this.indexArr.push.apply(this.indexArr, newIndices);
  },

  render: function (gl, usage) {
    this.indexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indexArr), usage);
  },

  draw: function (gl, mode) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
    gl.drawElements(mode, this.indexArr.length, gl.UNSIGNED_INT, 0);
  }
};

module.exports = Indexset;
