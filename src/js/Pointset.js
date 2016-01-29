"use strict";


function Pointset() {
  this.vertexArr = [];
  this.indexArr = [];
  this.vertexBuf = null;
  this.indexBuf = null;
}

Pointset.prototype = {
  clear: function () {
    this.vertexArr = [];
    this.indexArr = [];
  },

  insertPoint: function (point) {
    const index = this.vertexArr.length / 2;
    this.vertexArr.push(point[0], point[1]);
    this.indexArr.push(index);
  },

  render: function (gl, usage) {
    if (!this.indexBuf) { // TODO
      this.vertexBuf = gl.createBuffer();
      this.indexBuf = gl.createBuffer();
    }
    if (this.indexArr.length) {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArr), usage);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(this.indexArr), usage);
    }
  },

  draw: function (gl, basicProg) {
    if (this.indexBuf && this.indexArr.length) {
      const positionLoc = gl.getAttribLocation(basicProg, "a_position");
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
      gl.drawElements(gl.POINTS, this.indexArr.length, gl.UNSIGNED_INT, 0);
    }
  }
};

module.exports = Pointset;
