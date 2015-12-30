"use strict";

var nnng = require("nnng");
var compute = require("../compute");
var defs = require("../defs");
var iid = require("../lib/image-id");

var vertexShaderSrc = require("../shaders/vertex-shader.glsl");
var fragmentShaderSrc = require("../shaders/fragment-shader.glsl");


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
    var lastError = gl.getShaderInfoLog(shader);
    console.error(addLineNumbers(shaderSrc) + "\nError compiling shader: " + lastError);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, shaders) {
  var program = gl.createProgram();
  shaders.forEach(function (shader) {
      gl.attachShader(program, shader);
    });
  gl.linkProgram(program);
  var isLinked = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!isLinked) {
      var lastError = gl.getProgramInfoLog(program);
      console.error("Error linking program: " + lastError);
      gl.deleteProgram(program);
      return null;
  }
  return program;
}


function Painter(props) {
  this._frame = requestAnimationFrame(this._paint.bind(this));
  
  this._props = props;
  this._tileBordersPath = null;
  this._pendingPaint = true;
  
  this._prepareContext();
}

Painter.prototype = {
  _paintTileBorders: function (c, zoom) {
    if (!this._tileBordersPath) {
      var path = new Path2D();
      path.moveTo(0, 0);
      path.lineTo(0, defs.maxHeight);
      for (var lx = 1; lx <= defs.tileXCount; lx++) {
        var ldx = lx * defs.imageSize;
        path.moveTo(ldx, 0);
        path.lineTo(ldx, defs.maxHeight);
      }
      path.moveTo(0, 0);
      path.lineTo(defs.maxWidth, 0);
      for (var ly = 1; ly <= defs.tileYCount; ly++) {
        var ldy = ly * defs.imageSize;
        path.moveTo(0, ldy);
        path.lineTo(defs.maxWidth, ldy);
      }
      this._tileBordersPath = path;
    }
    c.lineWidth = compute.tileBorderLineWidth(zoom);
    c.strokeStyle = defs.borderColor;
    c.stroke(this._tileBordersPath);
  },
  
  _paintTileLabels: function (c, zoom, firstVisibleLocalX, firstVisibleLocalY, lastVisibleLocalX, lastVisibleLocalY) {
    var textMargin = compute.textMargin(zoom);
    c.fillStyle = defs.labelColor;
    c.font = 32 + "px " + defs.labelFont;
    c.textAlign = "left";
    c.textBaseline = "top";
    for (var lx = firstVisibleLocalX; lx <= lastVisibleLocalX; lx++) {
      var ldx = lx * defs.imageSize;
      var tx = defs.localToTileX(lx);
      var ngx = defs.localToNationalGridX(lx);
      for (var ly = firstVisibleLocalY; ly <= lastVisibleLocalY; ly++) {
        var ldy = ly * defs.imageSize;
        var ty = defs.localToTileY(ly);
        var ngy = defs.localToNationalGridY(ly);
        var latLon = nnng.from(ngx, ngy);
        var lat = latLon[0].toFixed(6);
        var lon = latLon[1].toFixed(6);
        c.fillText(tx + "n," + ty + "e (" + lat + "°N," + lon + "°E)", ldx + textMargin, ldy);
      }
    }
  },
  
  _paintCanvas: function (state) {
    var canvas = this._props.canvas;
    var devicePixelRatio = window.devicePixelRatio;
    var c = canvas.getContext("2d", {
        alpha: false
      });
    c.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    c.save();
    c.fillStyle = defs.backgroundColor;
    c.fillRect(0, 0, state.width, state.height);
    var scrollLeft = compute.scrollLeft(state.width, state.left, state.zoom);
    var scrollTop  = compute.scrollTop(state.height, state.top, state.zoom);
    c.translate(-scrollLeft, -scrollTop);
    c.translate(0.5 / devicePixelRatio, 0.5 / devicePixelRatio);
    var scaleRatio = compute.scaleRatio(state.zoom);
    c.scale(scaleRatio, scaleRatio);
    var firstVisibleLocalX = compute.firstVisibleLocalX(state.width, state.left, state.zoom);
    var firstVisibleLocalY = compute.firstVisibleLocalY(state.height, state.top, state.zoom);
    var lastVisibleLocalX  = compute.lastVisibleLocalX(state.width, state.left, state.zoom);
    var lastVisibleLocalY  = compute.lastVisibleLocalY(state.height, state.top, state.zoom);
    if (state.zoom < 3) {
      c.globalAlpha = 1 - (state.zoom - 2);
      this._paintTileLabels(c, state.zoom, firstVisibleLocalX, firstVisibleLocalY, lastVisibleLocalX, lastVisibleLocalY);
      c.globalAlpha = 1;
    }
    this._paintTileBorders(c, state.zoom);
    c.restore();
    c.save();
    c.translate(-scrollLeft, -scrollTop);
    c.scale(scaleRatio, scaleRatio);
    this._paintTileContents(c, state.time, state.zoom, firstVisibleLocalX, firstVisibleLocalY, lastVisibleLocalX, lastVisibleLocalY);
    c.restore();
    c.save();
    c.translate(0.5 / devicePixelRatio, 0.5 / devicePixelRatio);
  },

  _paint: function () {
    this._frame = requestAnimationFrame(this._paint.bind(this));
    
    var canvas = this._props.canvas;
    var state  = this._props.getDerivedState();
    var devicePixelRatio = window.devicePixelRatio;
    var deviceWidth      = devicePixelRatio * state.width;
    var deviceHeight     = devicePixelRatio * state.height;
    if (canvas.width !== deviceWidth || canvas.height !== deviceHeight) {
      canvas.width  = deviceWidth;
      canvas.height = deviceHeight;
      this._pendingPaint = true;
      if (this._props.useWebGL && this._context) {
        var gl = this._context.gl;
        gl.viewport(0, 0, deviceWidth, deviceHeight);
      }
    }
    
    if (this._pendingPaint) {
      this._pendingPaint = false;
      if (this._props.useWebGL) {
        this._paintWebGL(state);
      } else {
        this._paintCanvas(state);
      }
    }
  },
  
  _prepareContext: function () {
    if (this._props.useWebGL) {
      if (!this._context) {
        var canvas = this._props.canvas;
        var gl = canvas.getContext("webgl", {
            alpha: false
          });
        var vertexShader = loadShader(gl, vertexShaderSrc, gl.VERTEX_SHADER);
        var fragmentShader = loadShader(gl, fragmentShaderSrc, gl.FRAGMENT_SHADER);
        var program = createProgram(gl, [vertexShader, fragmentShader]);
        gl.useProgram(program);
        this._context = {
          gl: gl,
          program: program,
          bufCount: 0,
          vertexBufs: {},
          indexBufs: {}
        };
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);
      }
      var isFinished = this._context.bufCount === defs.maxTileCount;
      if (!isFinished) {
        var tileIds = this._props.getLoadedTileIds();
        var gl = this._context.gl;
        for (var i = 0; i < tileIds.length; i++) {
          var tileId = tileIds[i];
          if (!(tileId in this._context.vertexBufs)) {
            var tileData = this._props.getLoadedTile(tileId);
            var vertexBuf = gl.createBuffer();
            var indexBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuf);
            gl.bufferData(gl.ARRAY_BUFFER, tileData.vertices, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, tileData.indices, gl.STATIC_DRAW);
            this._context.bufCount++;
            this._context.vertexBufs[tileId] = vertexBuf;
            this._context.indexBufs[tileId] = indexBuf;
            return; // Yield...
          }
        }
      }
    }
  },
  
  _paintWebGL: function (state) {
    if (this._context) {
      var canvas = this._props.canvas;
      var devicePixelRatio = window.devicePixelRatio;
      var gl = this._context.gl;
      var tileIds = Object.keys(this._context.vertexBufs);
      var resolutionLoc = gl.getUniformLocation(this._context.program, "u_resolution");
      var positionLoc = gl.getAttribLocation(this._context.program, "a_position");
      var scaleLoc = gl.getUniformLocation(this._context.program, "u_scale");
      var moveLoc = gl.getUniformLocation(this._context.program, "u_move");
      var colorLoc = gl.getUniformLocation(this._context.program, "u_color");
      var pointSizeLoc = gl.getUniformLocation(this._context.program, "u_pointSize");
      var scale = Math.pow(2, state.zoom + 0.5) / 4;
      var zoomLevel = Math.pow(2, state.zoom + 0.5);
      var magic = devicePixelRatio * Math.sqrt(zoomLevel) / zoomLevel;
      var moveX = (defs.firstTileX + state.left * defs.tileXCount) * defs.tileSize;
      var moveY = (defs.lastTileY - state.top * defs.tileYCount) * defs.tileSize;
      gl.uniform2f(resolutionLoc, state.width, state.height);
      gl.uniform2f(scaleLoc, scale, scale);
      gl.uniform2f(moveLoc, -moveX, -moveY);
      var nodeSize = 9 * magic;
      var linkSize = 3 * magic;
      var nodeAlpha = Math.min(nodeSize, 1);
      var linkAlpha = Math.min(linkSize, 1);
      gl.uniform1f(pointSizeLoc, nodeSize);
      gl.lineWidth(linkSize);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      for (var i = 0; i < tileIds.length; i++) {
        var tileId = tileIds[i];
        var tileData = this._props.getLoadedTile(tileId);
        var vertexBuf = this._context.vertexBufs[tileId];
        var indexBuf = this._context.indexBufs[tileId];
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuf);
        gl.enableVertexAttribArray(positionLoc);
        gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
        var pointCount = tileData.roadNodes.length;
        var indexCount = tileData.indices.length;
        gl.uniform4f(colorLoc, 1, 1, 1, nodeAlpha);
        gl.drawElements(gl.POINTS, pointCount, gl.UNSIGNED_SHORT, 0);
        gl.uniform4f(colorLoc, 1, 1, 1, linkAlpha);
        gl.drawElements(gl.LINES, indexCount - pointCount, gl.UNSIGNED_SHORT, pointCount * 2);
      }
    }
  },

  loseContext: function () {
    this._context = null;
    cancelAnimationFrame(this._frame);
  },

  restoreContext: function () {
    this._frame = requestAnimationFrame(this._paint.bind(this));
    
    this._prepareContext();
  },

  update: function () {
    this._pendingPaint = true;
    
    this._prepareContext();
  }
};

module.exports = Painter;
