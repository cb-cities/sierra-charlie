"use strict";


function Lineset() {
  this.vertexArr = [];
  this.indexArr = [];
  this.vertexBuf = null;
  this.indexBuf = null;
}

Lineset.prototype = {
  clear: function () {
    this.vertexArr = [];
    this.indexArr = [];
  },

  insertLine: function (x1, y1, x2, y2) {
    const index = this.vertexArr.length / 2;
    this.vertexArr.push(x1, y1, x2, y2);
    this.indexArr.push(index, index + 1);
  },

  extend: function (vertices, indices) {
    const baseIndex = this.vertexArr.length / 2;
    this.vertexArr.push.apply(this.vertexArr, vertices);
    for (let i = 0; i < indices.length; i++) {
      this.indexArr.push(baseIndex + indices[i]);
    }
  },

  render: function (gl, usage) {
    if (!this.vertexBuf) { // TODO
      this.vertexBuf = gl.createBuffer();
      this.indexBuf = gl.createBuffer();
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArr), usage);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indexArr), usage);
  },

  draw: function (gl, vertexLoc) {
    if (this.vertexBuf) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
      gl.enableVertexAttribArray(vertexLoc);
      gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
      gl.drawElements(gl.LINES, this.indexArr.length, gl.UNSIGNED_INT, 0);
    }
  }
};

module.exports = Lineset;
