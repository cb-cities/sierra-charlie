"use strict";


function addLineNumbers(src) {
  return src.split("\n").map(function(line, i) {
      return (i + 1) + ": " + line;
    }).join("\n");
}


function loadShader(gl, shaderSrc, shaderType) {
  var shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSrc);
  gl.compileShader(shader);
  var isCompiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!isCompiled) {
    var prevError = gl.getShaderInfoLog(shader);
    console.error(addLineNumbers(shaderSrc) + "\nError compiling shader: " + prevError);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}


module.exports = {
  createProgram: function (gl, vertexShaderSrc, fragmentShaderSrc) {
    var program = gl.createProgram();
    var vertexShader = loadShader(gl, vertexShaderSrc, gl.VERTEX_SHADER);
    var fragmentShader = loadShader(gl, fragmentShaderSrc, gl.FRAGMENT_SHADER);
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var isLinked = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!isLinked) {
        var prevError = gl.getProgramInfoLog(program);
        console.error("Error linking program: " + prevError);
        gl.deleteProgram(program);
        return null;
    }
    return program;
  }
};
