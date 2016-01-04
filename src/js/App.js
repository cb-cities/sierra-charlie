"use strict";

var r = require("react-wrapper");

var EasedStateMixin = require("./EasedStateMixin");
var compute = require("./compute");





var Indexset = require("./Indexset");
var Lineset = require("./lineset");
var Quadtree = require("./Quadtree");
var Polyquadtree = require("./Polyquadtree");
var defs = require("./defs");
var glUtils = require("./gl-utils"); // TODO
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
      centerX: 530625,
      centerY: 177563,
      zoom: 5,
      rawTime: 10 + 9 / 60
    };
  },

  setStaticCenter: function (centerX, centerY) {
    this.setState({
        centerX: centerX,
        centerY: centerY
      });
  },

  setCenterX: function (centerX, duration) {
    this.isEasingCenterX = true;
    this.setEasedState("centerX", centerX, duration, function () {
        this.isEasingCenterX = false;
      }.bind(this));
  },

  setCenterY: function (centerY, duration) {
    this.isEasingCenterY = true;
    this.setEasedState("centerY", centerY, duration, function () {
        this.isEasingCenterY = false;
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
    return this.isEasingCenterX || this.isEasingCenterY || this.isEasingZoom;
  },

  getStaticCenterX: function () {
    return this.state.centerX;
  },

  getStaticCenterY: function () {
    return this.state.centerY;
  },

  getStaticZoom: function () {
    return this.state.zoom;
  },

  getStaticRawTime: function () {
    return this.state.rawTime;
  },

  getCenterX: function () {
    return this.getEasedState("centerX");
  },

  getCenterY: function () {
    return this.getEasedState("centerY");
  },

  getZoom: function () {
    return this.getEasedState("zoom");
  },

  getRawTime: function () {
    return this.getEasedState("rawTime");
  },

  componentDidMount: function () {
    this.updateFrameSpace();
    this.startDrawing();
  },

  componentDidUpdate: function () {
    this.updateFrameSpace();
    this.isDrawingNeeded = true;
  },

  updateFrameSpace: function () {
    var centerX = this.getCenterX();
    var centerY = this.getCenterY();
    var zoom = this.getZoom();
    this.updateSpace(zoom);
    this.updateFrame(centerX, centerY, zoom);
  },

  updateFrame: function (centerX, centerY, zoom) {
    var newScrollLeft = compute.scrollLeft(centerX, zoom);
    var newScrollTop = compute.scrollTop(centerY, zoom);
    if (this.prevScrollLeft !== newScrollLeft || this.prevScrollTop !== newScrollTop) {
      var frame = document.getElementById("map-frame");
      frame.scrollLeft = newScrollLeft;
      frame.scrollTop = newScrollTop;
      this.prevScrollLeft = newScrollLeft;
      this.prevScrollTop = newScrollTop;
    }
  },

  updateSpace: function (zoom) {
    var newWidth = compute.totalClientWidth(zoom);
    var newHeight = compute.totalClientHeight(zoom);
    if (this.prevWidth !== newWidth || this.prevHeight !== newHeight) {
      var space = document.getElementById("map-space");
      space.style.width = newWidth + "px";
      space.style.height = newHeight + "px";
      this.prevWidth = newWidth;
      this.prevHeight = newHeight;
    }
  },

  render: function () {
    return r.div();
  },



  startDrawing: function () {
    this.isAnimationFrameRequested = requestAnimationFrame(this.onAnimationFrameReceived);
    this.updateDrawingContext();
  },

  updateDrawingContext: function () {
    if (!this.drawingContext) {
      this.isDrawingNeeded = true;
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
      this.drawingContext = {
        gl: gl,
        program: program,
        pixelRatio: devicePixelRatio,
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
      Grid.render(gl); // TODO
    }
    var cx = this.drawingContext;
    var gl = cx.gl;
    if (Geometry.render(gl)) { // OMG TODO
      this.isDrawingNeeded = true;
    }
    if (cx.pixelRatio !== devicePixelRatio) { // TODO
      this.isDrawingNeeded = true;
      cx.pixelRatio = devicePixelRatio;
    }
  },

  onAnimationFrameReceived: function () {
    if (!this.drawingContext) {
      return;
    }
    this.isAnimationFrameRequested = requestAnimationFrame(this.onAnimationFrameReceived);
    var cx = this.drawingContext;
    var gl = cx.gl;
    var canvas = document.getElementById("map-canvas");
    var deviceWidth = cx.pixelRatio * canvas.clientWidth; // TODO
    var deviceHeight = cx.pixelRatio * canvas.clientHeight; // TODO
    if (canvas.width !== deviceWidth || canvas.height !== deviceHeight) {
      this.isDrawingNeeded = true;
      canvas.width = deviceWidth;
      canvas.height = deviceHeight;
      gl.viewport(0, 0, deviceWidth, deviceHeight);
    }
    if (this.isDrawingNeeded) {
      this.isDrawingNeeded = false;
      var centerX = this.getCenterX();
      var centerY = this.getCenterY();
      var zoom = this.getZoom();
      // var time = compute.time(this.getRawTime());
      var zoomLevel = compute.zoomLevel(zoom);

      var gl = cx.gl;
      gl.uniform2f(cx.resolutionLoc, canvas.clientWidth, canvas.clientHeight); // TODO

      var dilation = defs.clientTileRatio * zoomLevel / 2;
      gl.uniform2f(cx.dilationLoc, dilation, dilation);

      var translationX = defs.firstTileX + left * defs.spaceWidth;
      var translationY = defs.lastTileY + defs.tileSize - top * defs.spaceHeight;
      gl.uniform2f(cx.translationLoc, translationX, translationY);

      gl.clear(gl.COLOR_BUFFER_BIT);

      // Draw grid
      gl.lineWidth(1);
      gl.uniform4f(cx.colorLoc, 0.2, 0.2, 0.2, 1);
      Grid.draw(gl, cx.positionLoc); // TODO

      if (Geometry.bindVertexBuffer(gl)) { // TODO
        gl.enableVertexAttribArray(cx.positionLoc);
        gl.vertexAttribPointer(cx.positionLoc, 2, gl.FLOAT, false, 0, 0);

        // Draw road links
        var roadLinkSize = 2 * Math.sqrt(zoomLevel) * cx.pixelRatio / zoomLevel;
        var roadLinkAlpha = Math.min(roadLinkSize, 1);
        gl.lineWidth(roadLinkSize);
        gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadLinkAlpha);
        Geometry.drawRoadLinks(gl); // TODO
        gl.uniform4f(cx.colorLoc, 1, 1, 1, roadLinkAlpha);
        this.hoveredRoadLinkIndices.draw(gl, gl.LINES); // TODO

        // Draw road nodes
        var roadNodeSize = 8 * Math.cbrt(zoomLevel) * cx.pixelRatio / zoomLevel;
        var roadNodeAlpha = Math.min(roadNodeSize, 1);
        gl.uniform1f(cx.pointSizeLoc, roadNodeSize);
        gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadNodeAlpha);
        Geometry.drawRoadNodes(gl); // TODO
        gl.uniform4f(cx.colorLoc, 1, 1, 1, roadNodeAlpha);
        this.hoveredRoadNodeIndices.draw(gl, gl.POINTS); // TODO
      }
    }
  }
};

r.makeComponent("App", module);
