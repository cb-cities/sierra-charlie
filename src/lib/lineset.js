"use strict";


// NOTE: Uses 16-bit indices

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
  
  insert: function (x1, y1, x2, y2) {
    var index = this.vertexArr.length / 2;
    this.vertexArr.push(x1, y1, x2, y2);
    this.indexArr.push(index, index + 1);
  },
  
  insertMany: function () {
    var baseIndex = this.vertexArr.length / 2;
    this.vertexArr.push.apply(this.vertexArr, arguments);
    for (var i = 0; i < arguments.length; i++) {
      if (i > 0 && i < arguments.length - 1) {
        this.indexArr.push(baseIndex + i, baseIndex + i);
      } else {
        this.indexArr.push(baseIndex + i);
      }
    }
  },
  
  insertPoints: function (ps) {
    var baseIndex = this.vertexArr.length / 2;
    for (var i = 0; i < ps.length; i++) {
      this.vertexArr.push(ps[i].x, ps[i].y)
      if (i > 0 && i < ps.length - 1) {
        this.indexArr.push(baseIndex + i, baseIndex + i);
      } else {
        this.indexArr.push(baseIndex + i);
      }
    }
  },
  
  render: function (gl, usage) {
    this.vertexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertexArr), usage);;
    this.indexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indexArr), usage);
  },
  
  draw: function (gl, vertexLoc) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
    gl.enableVertexAttribArray(vertexLoc);
    gl.vertexAttribPointer(vertexLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
    gl.drawElements(gl.LINES, this.indexArr.length, gl.UNSIGNED_SHORT, 0);
  }
};

module.exports = Lineset;
