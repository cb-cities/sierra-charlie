"use strict";


function Lineset() {
  this.vertexArr = [];
  this.indexArr = [];
  this.vertexBuf = null;
  this.indexBuf = null;
}

Lineset.prototype = {
  insert: function (x1, y1, x2, y2) {
    var v = this.vertexArr.length / 2;
    this.vertexArr.push(x1, y1, x2, y2);
    this.indexArr.push(v, v + 1);
  },
  
  insertPolyline: function (ps) {
    var v = this.vertexArr.length / 2;
    for (var i = 0; i < ps.length; i++) {
      this.vertexArr.push(ps[i].x, ps[i].y)
      if (i > 0 && i < ps.length - 1) {
        this.indexArr.push(v + i, v + i);
      } else {
        this.indexArr.push(v + i);
      }
    }
  },
  
  render: function (gl) {
    var vs = new Float32Array(this.vertexArr);
    this.vertexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuf);
    gl.bufferData(gl.ARRAY_BUFFER, vs, gl.DYNAMIC_DRAW);
    var is = new Uint16Array(this.indexArr);
    this.indexBuf = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuf);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, is, gl.DYNAMIC_DRAW);
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
