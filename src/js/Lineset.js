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

  insertLine: function (pointA, pointB) {
    const index = this.vertexArr.length / 2;
    this.vertexArr.push(pointA[0], pointA[1], pointB[0], pointB[1]);
    this.indexArr.push(index, index + 1);
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
