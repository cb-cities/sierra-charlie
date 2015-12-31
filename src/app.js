"use strict";

var GeometryLoader = require("worker?inline!./geometry-loader");

var r = require("react-wrapper");
var compute = require("./compute");
var defs = require("./defs");
var easeStateMixin = require("./ease-state-mixin");
var glUtils = require("./lib/gl-utils");
var vertexShader = require("./shaders/vertex-shader.glsl");
var fragmentShader = require("./shaders/fragment-shader.glsl");


module.exports = {
  mixins: [
    easeStateMixin
  ],


  getInitialState: function () {
    return {
      left:    0.4897637424698795,
      top:     0.4768826844262295,
      rawTime: 10 + 9 / 60
    };
  },


  setLeft: function (left, duration) {
    this.easingLeft = true;
    this.easeState("left", left, duration, function () {
        this.easingLeft = false;
      }.bind(this));
  },
 
  setTop: function (top, duration) {
    this.easingTop = true;
    this.easeState("top", top, duration, function () {
        this.easingTop = false;
      }.bind(this));
  },

  setRawTime: function (rawTime, duration) {
    this.easeState("rawTime", rawTime, duration);
  },

  setZoom: function (zoom, duration) {
    this.easingZoom = true;
    this.easeState("zoom", zoom, duration, function () {
        this.easingZoom = false;
      }.bind(this));
  },



  startGeometryLoader: function () {
    this.vertices = new Float32Array(defs.maxVertexCount * 2);
    this.vertexCount = 0;
    this.roadNodeIndices = new Uint32Array(defs.maxRoadNodeIndexCount);
    this.roadNodeIndexCount = 0;
    this.roadLinkIndices = new Uint32Array(defs.maxRoadLinkIndexCount);
    this.roadLinkIndexCount = 0;
    this.geometryLoader = new GeometryLoader();
    this.geometryLoader.addEventListener("message", this.onMessage);
    this.geometryLoader.postMessage({
        message: "setOrigin",
        origin: location.origin
      });
  },

  stopGeometryLoader: function () {
    this.geometryLoader.removeEventListener("message", this.onMessage);
    this.geometryLoader.terminate();
  },
  
  updateGeometryLoader: function () {
    if (this.vertexCount !== defs.maxVertexCount) {
      this.geometryLoader.postMessage({
          message: "update",
          left: this.getEasedState("left"),
          top: this.getEasedState("top")
        });
    }
  },

  onMessage: function (event) {
    switch (event.data.message) {
      case "loadGeometry":
        this.onLoadGeometry(event.data);
        break;
    }
  },
  
  onLoadGeometry: function (data) {
    this.vertices.set(data.roadNodeVertices, this.vertexCount * 2);
    this.vertexCount += data.roadNodeVertices.length / 2;
    this.vertices.set(data.roadLinkVertices, this.vertexCount * 2);
    this.vertexCount += data.roadLinkVertices.length / 2;
    this.roadNodeIndices.set(data.roadNodeIndices, this.roadNodeIndexCount);
    this.roadNodeIndexCount += data.roadNodeIndices.length;
    this.roadNodeCount += data.roadNodes.length;
    this.roadLinkIndices.set(data.roadLinkIndices, this.roadLinkIndexCount);
    this.roadLinkIndexCount += data.roadLinkIndices.length;
    this.roadLinkCount += data.roadLinks.length;
    if (this.vertexCount === defs.maxVertexCount) {
      this.stopGeometryLoader();
    }
    this.updatePainterContext();
  },



  startPainter: function () {
    this.painterReceipt = requestAnimationFrame(this.onPaint);
    this.updatePainterContext();
  },
  
  updatePainterContext: function () {
    if (!this.painterContext) {
      this.needsPainting = true;
      var frame = r.domNode(this);
      var canvas = frame.firstChild;
      var gl = canvas.getContext("webgl", {
          alpha: false
        });
      var program = glUtils.createProgram(gl, vertexShader, fragmentShader);
      gl.useProgram(program);
      var vertexBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuf);
      var positionLoc = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
      var roadNodeIndexBuf = gl.createBuffer();
      var roadLinkIndexBuf = gl.createBuffer();
      this.painterContext = {
        gl: gl,
        program: program,
        vertexBuf: vertexBuf,
        vertexCount: 0,
        roadNodeIndexBuf: roadNodeIndexBuf,
        roadNodeIndexCount: 0,
        roadLinkIndexBuf: roadLinkIndexBuf,
        roadLinkIndexCount: 0,
        devicePixelRatio: window.devicePixelRatio,
      };
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      gl.getExtension("OES_element_index_uint");
    }
    var context = this.painterContext;
    if (context.vertexCount !== this.vertexCount) {
      this.needsPainting = true;
      var gl = context.gl;
      gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
      context.vertexCount = this.vertexCount;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, context.roadNodeIndexBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.roadNodeIndices, gl.STATIC_DRAW);
      context.roadNodeIndexCount = this.roadNodeIndexCount;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, context.roadLinkIndexBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.roadLinkIndices, gl.STATIC_DRAW);
      context.roadLinkIndexCount = this.roadLinkIndexCount;
    }
    if (context.devicePixelRatio !== window.devicePixelRatio) {
      this.needsPainting = true;
      context.devicePixelRatio = window.devicePixelRatio;
    }
  },
  
  onPaint: function () {
    if (!this.painterContext) {
      return;
    }
    this.painterReceipt = requestAnimationFrame(this.onPaint);
    var context = this.painterContext;
    var frame = r.domNode(this);
    var canvas = frame.firstChild;
    var width = context.devicePixelRatio * canvas.clientWidth;
    var height = context.devicePixelRatio * canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      this.needsPainting = true;
      var gl = context.gl;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    if (this.needsPainting) {
      this.needsPainting = false;
      var left = this.getEasedState("left");
      var top = this.getEasedState("top");
      var zoom = this.getEasedState("zoom");
      var zoomLevel = Math.pow(2, zoom + 0.5);
      var magic = context.devicePixelRatio * Math.sqrt(zoomLevel) / zoomLevel;
      var gl = context.gl;
      var resolutionLoc = gl.getUniformLocation(context.program, "u_resolution");
      gl.uniform2f(resolutionLoc, canvas.clientWidth, canvas.clientHeight);
      var dilationLoc = gl.getUniformLocation(context.program, "u_dilation");
      var dilation = zoomLevel / 4;
      gl.uniform2f(dilationLoc, dilation, dilation);
      var translationLoc = gl.getUniformLocation(context.program, "u_translation");
      var translationX = (defs.firstTileX + left * defs.tileXCount) * defs.tileSize;
      var translationY = (defs.lastTileY - top * defs.tileYCount) * defs.tileSize;
      gl.uniform2f(translationLoc, -translationX, -translationY);
      var roadNodeSize = 9 * magic;
      var roadLinkSize = 3 * magic;
      var roadNodeAlpha = Math.min(roadNodeSize, 1);
      var roadLinkAlpha = Math.min(roadLinkSize, 1);
      var pointSizeLoc = gl.getUniformLocation(context.program, "u_pointSize");
      gl.uniform1f(pointSizeLoc, roadNodeSize);
      gl.lineWidth(roadLinkSize);
      var colorLoc = gl.getUniformLocation(context.program, "u_color");
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, context.roadNodeIndexBuf);
      gl.uniform4f(colorLoc, 1, 1, 1, roadNodeAlpha);
      gl.drawElements(gl.POINTS, context.roadNodeIndexCount, gl.UNSIGNED_INT, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, context.roadLinkIndexBuf);
      gl.uniform4f(colorLoc, 1, 1, 1, roadLinkAlpha);
      gl.drawElements(gl.LINES, context.roadLinkIndexCount, gl.UNSIGNED_INT, 0);
    }
  },

  onLoseContext: function (event) {
    event.preventDefault();
    cancelAnimationFrame(this.painterReceipt);
    this.painterContext = null;
    this.painterReceipt = null;
  },
  
  onRestoreContext: function () {
    this.startPainter();
  },



  updateFrame: function (left, top, zoom) {
    var frame = r.domNode(this);
    var left = this.getEasedState("left");
    var top = this.getEasedState("top");
    var zoom = this.getEasedState("zoom");
    frame.scrollLeft = compute.frameScrollLeft(left, zoom);
    frame.scrollTop  = compute.frameScrollTop(top, zoom);
  },

  componentDidMount: function () {
    var frame = r.domNode(this);
    var canvas = frame.firstChild;
    canvas.addEventListener("webglcontextlost", this.onLoseContext);
    canvas.addEventListener("webglcontextrestored", this.onRestoreContext);
    frame.addEventListener("scroll", this.onScroll);
    addEventListener("resize", this.onResize);
    addEventListener("keydown", this.onKeyDown);
    this.startGeometryLoader();
    this.startPainter();
    this.updateFrame();
  },

  componentDidUpdate: function () {
    this.updateFrame();
    this.updateGeometryLoader();
    this.needsPainting = true;
  },
  
  render: function () {
    var zoom = this.getEasedState("zoom");
    return (
      r.div("map-frame",
        r.canvas("map-canvas"),
        r.div({
            className: "map-space",
            style: {
              width:  compute.spaceWidth(zoom),
              height: compute.spaceHeight(zoom)
            },
            onDoubleClick: this.onDoubleClick
          })));
  },
  


  onScroll: function (event) {
    if (!this.easingLeft && !this.easingTop && !this.easingZoom) {
      var frame = r.domNode(this);
      var zoom = this.getEasedState("zoom");
      this.setState({
          left: compute.leftFromFrameScrollLeft(frame.scrollLeft, zoom),
          top: compute.topFromFrameScrollTop(frame.scrollTop, zoom)
        });
    }
  },
  
  onResize: function () {
    this.needsPainting = true;
  },

  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    var canvas = r.domNode(this).firstChild;
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    var pageWidth = compute.pageWidth(width, this.state.zoom);
    var pageHeight = compute.pageHeight(height, this.state.zoom);
    var duration = event.shiftKey ? 2500 : 500;
    var timeDelta = (event.ctrlKey || event.altKey) ? 60 : 3600;
    var zoomDelta = (event.altKey || event.ctrlKey) ? 2 : 10;
    switch (event.keyCode) {
      case 37: // left
      case 36: // home
        var left = Math.max(0, this.state.left - pageWidth / (event.keyCode === 36 ? 1 : 10));
        this.setLeft(left, duration);
        break;
      case 39: // right
      case 35: // end
        var left = Math.min(this.state.left + pageWidth / (event.keyCode === 35 ? 1 : 10), 1);
        this.setLeft(left, duration);
        break;
      case 38: // up
      case 33: // page up
        var top = Math.max(0, this.state.top - pageHeight / (event.keyCode === 33 ? 1 : 10));
        this.setTop(top, duration);
        break;
      case 40: // down
      case 34: // page down
        var top = Math.min(this.state.top + pageHeight / (event.keyCode === 34 ? 1 : 10), 1);
        this.setTop(top, duration);
        break;
      // case 219: // left bracket
      //   var rawTime = Math.round((this.state.rawTime * 3600) - timeDelta) / 3600;
      //   this.setRawTime(rawTime, duration);
      //   break;
      // case 221: // right bracket
      //   var rawTime = Math.round((this.state.rawTime * 3600) + timeDelta) / 3600;
      //   this.setRawTime(rawTime, duration);
      //   break;
      case 187: // plus
        var zoom = Math.max(0, (Math.round((this.state.zoom * 10) - zoomDelta) / 10));
        this.setZoom(zoom, duration);
        break;
      case 189: // minus
        var zoom = Math.min(Math.round((this.state.zoom * 10) + zoomDelta) / 10, defs.maxZoom);
        this.setZoom(zoom, duration);
        break;
      default:
        if (event.keyCode >= 49 && event.keyCode <= 57) {
          var zoom = event.keyCode - 49;
          this.setZoom(zoom, duration);
        }
    }
  },

  onDoubleClick: function (event) {
    // console.log("doubleClick", event.clientX, event.clientY);
    var canvas = r.domNode(this).firstChild;
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    var left = compute.leftFromEventClientX(event.clientX, width, this.state.left, this.state.zoom);
    var top = compute.topFromEventClientY(event.clientY, height, this.state.top, this.state.zoom);
    var duration = !event.shiftKey ? 500 : 2500;
    this.setLeft(left, duration);
    this.setTop(top, duration);
    if (!event.altKey) {
      this.setZoom(Math.max(0, this.state.zoom - 1), duration);
    } else {
      this.setZoom(Math.min(this.state.zoom + 1, defs.maxZoom), duration);
    }
  }
};

r.makeComponent("App", module);
