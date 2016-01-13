"use strict";


function addLineNumbers(src) {
  return src.split("\n").map(function(line, i) {
      return (i + 1) + ": " + line;
    }).join("\n");
}


function loadShader(gl, shaderSrc, shaderType) {
  const shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSrc);
  gl.compileShader(shader);
  const isCompiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!isCompiled) {
    const prevError = gl.getShaderInfoLog(shader);
    console.error(addLineNumbers(shaderSrc) + "\nError compiling shader: " + prevError);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}


module.exports = {
  createProgram: function (gl, vertexShaderSrc, fragmentShaderSrc) {
    const program = gl.createProgram();
    const vertexShader = loadShader(gl, vertexShaderSrc, gl.VERTEX_SHADER);
    const fragmentShader = loadShader(gl, fragmentShaderSrc, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const isLinked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!isLinked) {
        const prevError = gl.getProgramInfoLog(program);
        console.error("Error linking program: " + prevError);
        gl.deleteProgram(program);
        return null;
    }
    return program;
  }
};
