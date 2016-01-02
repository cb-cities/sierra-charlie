"use strict";


function Indexset() {
  this.indexArr = [];
  this.indexBuf = null;
}

Indexset.prototype = {
  clear: function () {
    this.indexArr = [];
  },
  
  insert: function (index) {
    this.indexArr.push(index);
  },
  
  insertMany: function (indices) {
    this.indexArr.push.apply(this.indexArr, indices);
  },
  
  copyMany: function (arr, baseIndex, count) {
    for (var i = baseIndex; i < baseIndex + count; i++) {
      this.indexArr.push(arr[i]);
    }
  },
  
  render: function (gl, usage) {
    this.indexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indexArr), usage);
  },
  
  draw: function (gl, mode, type) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
    gl.drawElements(mode, this.indexArr.length, type, 0);
  }
};

module.exports = Indexset;
