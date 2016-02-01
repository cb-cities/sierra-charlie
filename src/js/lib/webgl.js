"use strict";


function addLineNumbers(src) {
  return src.split("\n").map(function (line, i) {
    return (i + 1) + ": " + line;
  }).join("\n");
}


const _ = module.exports = {
  compileShader: function (gl, src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    const ok = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (ok) {
      return shader;
    } else {
      const prevError = gl.getShaderInfoLog(shader);
      console.error(addLineNumbers(src) + "\nError compiling shader: " + prevError);
      gl.deleteShader(shader);
      return null;
    }
  },

  linkProgram: function (gl, vertSrc, fragSrc) {
    const prog = gl.createProgram();
    const vertShader = _.compileShader(gl, vertSrc, gl.VERTEX_SHADER);
    const fragShader = _.compileShader(gl, fragSrc, gl.FRAGMENT_SHADER);
    gl.attachShader(prog, vertShader);
    gl.attachShader(prog, fragShader);
    gl.linkProgram(prog);
    const ok = gl.getProgramParameter(prog, gl.LINK_STATUS);
    if (ok) {
      return prog;
    } else {
      const prevError = gl.getProgramInfoLog(prog);
      console.error("Error linking program: " + prevError);
      gl.deleteProgram(prog);
      return null;
    }
  },

  createTexture: function (gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  },

  updateTexture: function (gl, texture, format, size, data) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, format, size, size, 0, format, gl.UNSIGNED_BYTE, data);
  }
};
