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
  }
};
