"use strict";


function Indexset() {
  this.indexArr = [];
  this.indexBuf = null;
}

Indexset.prototype = {
  size: function () {
    return this.indexArr.length;
  },

  clear: function () {
    this.indexArr = [];
  },

  insert: function (indices) {
    this.indexArr.push.apply(this.indexArr, indices);
  },

  render: function (gl, usage) {
    if (!this.indexBuf) { // TODO
      this.indexBuf = gl.createBuffer();
    }
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indexArr), usage);
  },

  draw: function (gl, mode) {
    if (this.indexBuf) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
      gl.drawElements(mode, this.indexArr.length, gl.UNSIGNED_INT, 0);
    }
  }
};

module.exports = Indexset;
