"use strict";

var r = require("react-wrapper");

var EasedStateMixin = require("./EasedStateMixin");
var compute = require("./compute");





var Indexset = require("./Indexset");
var Lineset = require("./lineset");
var Quadtree = require("./Quadtree");
var Polyquadtree = require("./Polyquadtree");
var defs = require("./defs");
var glUtils = require("./gl-utils");
var polyline = require("./polyline");
var vector = require("./vector");
var stats = require("./stats");
var rect = require("./rect");

var fragmentShader = require("../glsl/fragment-shader.glsl");
var vertexShader = require("../glsl/vertex-shader.glsl");


module.exports = {
  mixins: [EasedStateMixin],

  getInitialState: function () {
    return {
      left: 0.4897637424698795,
      top: 0.4768826844262295,
      zoom: 5,
      rawTime: 10 + 9 / 60
    };
  },

  setStaticLeftTop: function (left, top) {
    this.setState({
        left: left,
        top: top
      });
  },

  setLeft: function (left, duration) {
    this.isEasingLeft = true;
    this.setEasedState("left", left, duration, function () {
        this.isEasingLeft = false;
      }.bind(this));
  },

  setTop: function (top, duration) {
    this.isEasingTop = true;
    this.setEasedState("top", top, duration, function () {
        this.isEasingTop = false;
      }.bind(this));
  },

  setZoom: function (zoom, duration) {
    this.isEasingZoom = true;
    this.setEasedState("zoom", zoom, duration, function () {
        this.isEasingZoom = false;
      }.bind(this));
  },

  setRawTime: function (rawTime, duration) {
    this.isEasingRawTime = true;
    this.setEasedState("rawTime", rawTime, duration, function () {
        this.isEasingRawTime = false;
      }.bind(this));
  },

  isScrolling: function () {
    return this.isEasingLeft || this.isEasingTop || this.isEasingZoom;
  },

  getStaticLeft: function () {
    return this.state.left;
  },

  getStaticTop: function () {
    return this.state.top;
  },

  getStaticZoom: function () {
    return this.state.zoom;
  },

  getStaticRawTime: function () {
    return this.state.rawTime;
  },

  getLeft: function () {
    return this.getEasedState("left");
  },

  getTop: function () {
    return this.getEasedState("top");
  },

  getZoom: function () {
    return this.getEasedState("zoom");
  },

  getRawTime: function () {
    return this.getEasedState("rawTime");
  },

  getClientWidth: function () { // TODO
    var canvas = document.getElementById("map-canvas");
    return canvas.clientWidth;
  },

  getClientHeight: function () { // TODO
    var canvas = document.getElementById("map-canvas");
    return canvas.clientHeight;
  },

  componentDidMount: function () {
    this.updateFrameSpace();
    this.startPainter();
  },

  componentDidUpdate: function () {
    this.updateFrameSpace();
    this.needsPainting = true;
  },
  
  updateFrameSpace: function () {
    var left = this.getLeft();
    var top = this.getTop();
    var zoom = this.getZoom();
    this.updateSpace(zoom);
    this.updateFrame(left, top, zoom);
  },

  updateFrame: function (left, top, zoom) {
    var newScrollLeft = compute.frameScrollLeft(left, zoom);
    var newScrollTop = compute.frameScrollTop(top, zoom);
    if (this.updatedFrameScrollLeft !== newScrollLeft || this.updatedFrameScrollTop !== newScrollTop) {
      var frame = document.getElementById("map-frame");
      frame.scrollLeft = newScrollLeft;
      frame.scrollTop = newScrollTop;
      this.updatedFrameScrollLeft = newScrollLeft;
      this.updatedFrameScrollTop = newScrollTop;
    }
  },

  updateSpace: function (zoom) {
    var newWidth = compute.spaceWidth(zoom);
    var newHeight = compute.spaceHeight(zoom);
    if (this.updatedSpaceWidth !== newWidth || this.updatedSpaceHeight !== newHeight) {
      var space = document.getElementById("map-space");
      space.style.width = newWidth + "px";
      space.style.height = newHeight + "px";
      this.updatedSpaceWidth = newWidth;
      this.updatedSpaceHeight = newHeight;
    }
  },

  render: function () {
    return r.div();
  },










  // TODO: Refactor
  prepareGrid: function (gl) {
    var left = defs.firstTileX * defs.tileSize;
    var top = defs.firstTileY * defs.tileSize;
    var right = (defs.lastTileX + 1) * defs.tileSize;
    var bottom = (defs.lastTileY + 1) * defs.tileSize;
    this.gridLines = new Lineset();
    for (var x = left; x <= right; x += defs.tileSize) {
      this.gridLines.insertLine(x, top, x, bottom);
    }
    for (var y = bottom; y >= top; y -= defs.tileSize) {
      this.gridLines.insertLine(left, y, right, y);
    }
    this.gridLines.render(gl, gl.STATIC_DRAW);
  },

  startPainter: function () {
    this.painterReceipt = requestAnimationFrame(this.onPaint);
    this.updatePainterContext();
  },

  updatePainterContext: function () {
    if (!this.painterContext) {
      this.needsPainting = true;
      var canvas = document.getElementById("map-canvas");
      var gl = canvas.getContext("webgl", {
          alpha: false
        });
      var program = glUtils.createProgram(gl, vertexShader, fragmentShader);
      gl.useProgram(program);
      var positionLoc = gl.getAttribLocation(program, "a_position");
      var resolutionLoc = gl.getUniformLocation(program, "u_resolution");
      var dilationLoc = gl.getUniformLocation(program, "u_dilation");
      var translationLoc = gl.getUniformLocation(program, "u_translation");
      var pointSizeLoc = gl.getUniformLocation(program, "u_pointSize");
      var colorLoc = gl.getUniformLocation(program, "u_color");
      this.painterContext = {
        gl: gl,
        program: program,
        vertexCount: 0,
        roadNodeIndexCount: 0,
        roadLinkIndexCount: 0,
        devicePixelRatio: window.devicePixelRatio,
        positionLoc: positionLoc,
        resolutionLoc: resolutionLoc,
        dilationLoc: dilationLoc,
        translationLoc: translationLoc,
        pointSizeLoc: pointSizeLoc,
        colorLoc: colorLoc
      };
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      gl.getExtension("OES_element_index_uint");
      this.prepareGrid(gl);
    }
    var cx = this.painterContext;
    var gl = cx.gl;
    if (cx.vertexCount !== Geometry.vertexCount) { // TODO
      this.needsPainting = true;
      cx.vertexCount = Geometry.vertexCount;
      cx.roadNodeIndexCount = Geometry.roadNodeIndexCount;
      cx.roadLinkIndexCount = Geometry.roadLinkIndexCount;
      Geometry.render(gl); // OMG TODO
    }
    if (cx.devicePixelRatio !== window.devicePixelRatio) { // TODO
      this.needsPainting = true;
      cx.devicePixelRatio = window.devicePixelRatio;
    }
  },

  onPaint: function () {
    if (!this.painterContext) {
      return;
    }
    this.painterReceipt = requestAnimationFrame(this.onPaint);
    var cx = this.painterContext;
    var gl = cx.gl;
    var canvas = document.getElementById("map-canvas");
    var width = cx.devicePixelRatio * canvas.clientWidth;
    var height = cx.devicePixelRatio * canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      this.needsPainting = true;
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
    if (this.needsPainting) {
      this.needsPainting = false;
      var left = this.getLeft();
      var top = this.getTop();
      var zoom = this.getZoom();
      // var time = compute.time(this.getRawTime());
      var zoomLevel = compute.zoomLevel(zoom);

      var gl = cx.gl;
      gl.uniform2f(cx.resolutionLoc, canvas.clientWidth, canvas.clientHeight); // TODO

      var dilation = defs.tileSize / defs.imageSize * zoomLevel / 2;
      gl.uniform2f(cx.dilationLoc, dilation, dilation);

      var translationX = (defs.firstTileX + left * defs.tileXCount) * defs.tileSize;
      var translationY = (defs.lastTileY + 1 - top * defs.tileYCount) * defs.tileSize;
      gl.uniform2f(cx.translationLoc, translationX, translationY);

      gl.clear(gl.COLOR_BUFFER_BIT);

      // Draw grid
      gl.lineWidth(1);
      gl.uniform4f(cx.colorLoc, 0.2, 0.2, 0.2, 1);
      this.gridLines.draw(gl, cx.positionLoc);

      if (Geometry.bindVertexBuffer(gl)) {
        gl.enableVertexAttribArray(cx.positionLoc);
        gl.vertexAttribPointer(cx.positionLoc, 2, gl.FLOAT, false, 0, 0);

        // Draw road links
        var roadLinkSize = 2 * cx.devicePixelRatio / zoomLevel * Math.sqrt(zoomLevel);
        var roadLinkAlpha = Math.min(roadLinkSize, 1);
        gl.lineWidth(roadLinkSize);
        gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadLinkAlpha);
        Geometry.drawRoadLinks(gl);
        gl.uniform4f(cx.colorLoc, 1, 0, 0, 1);
        this.hoveredRoadLinkIndices.draw(gl, gl.LINES); // TODO

        // Draw road nodes
        var roadNodeSize = 8 * cx.devicePixelRatio / zoomLevel * Math.cbrt(zoomLevel);
        var roadNodeAlpha = Math.min(roadNodeSize, 1);
        gl.uniform1f(cx.pointSizeLoc, roadNodeSize);
        gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadNodeAlpha);
        Geometry.drawRoadNodes(gl);
        gl.uniform4f(cx.colorLoc, 1, 0, 0, 1);
        this.hoveredRoadNodeIndices.draw(gl, gl.POINTS); // TODO

        // gl.lineWidth(1);
        // gl.uniform4f(cx.colorLoc, 1, 0, 0, 1);
        // this.roadNodeTreeLines.draw(gl, cx.positionLoc);
        // gl.uniform4f(cx.colorLoc, 0, 1, 0, 1);
        // this.roadLinkTreeLines.draw(gl, cx.positionLoc);
      }
    }
  }
};

r.makeComponent("App", module);
