"use strict";

var r = require("react-wrapper");

var EasedStateMixin = require("./EasedStateMixin");
var compute = require("./compute");
var defs = require("./defs");

var glUtils = require("./gl-utils"); // TODO
var fragmentShader = require("../glsl/fragment-shader.glsl");
var vertexShader = require("../glsl/vertex-shader.glsl");


module.exports = {
  mixins: [EasedStateMixin],

  getInitialState: function () {
    return {
      centerX: 530625,
      centerY: 177563,
      zoom: 7,
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

  setCenter: function (p, duration) {
    this.setCenterX(p.x, duration);
    this.setCenterY(p.y, duration);
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
    this.hoveredRoadNodeIndices = Controller.hoveredRoadNodeIndices; // TODO
    this.hoveredRoadLinkIndices = Controller.hoveredRoadLinkIndices; // TODO
    this.selectedRoadNodeIndices = Controller.selectedRoadNodeIndices; // TODO
    this.selectedRoadLinkIndices = Controller.selectedRoadLinkIndices; // TODO

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
    var newScrollLeft = compute.scrollLeftFromCenterX(centerX, zoom);
    var newScrollTop = compute.scrollTopFromCenterY(centerY, zoom);
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
    var gl;
    var cx;
    if (!this.drawingContext) {
      this.isDrawingNeeded = true;
      var canvas = document.getElementById("map-canvas");
      gl = canvas.getContext("webgl", {
          alpha: false
        });
      var program = glUtils.createProgram(gl, vertexShader, fragmentShader);
      gl.useProgram(program);
      var vertexLoc = gl.getAttribLocation(program, "vertex");
      var pixelFitLoc = gl.getUniformLocation(program, "pixelFit");
      var scaleRatioLoc = gl.getUniformLocation(program, "scaleRatio");
      var centerLoc = gl.getUniformLocation(program, "center");
      var pointSizeLoc = gl.getUniformLocation(program, "pointSize");
      var colorLoc = gl.getUniformLocation(program, "color");
      cx = this.drawingContext = {
        gl: gl,
        program: program,
        pixelRatio: window.devicePixelRatio,
        vertexLoc: vertexLoc,
        pixelFitLoc: pixelFitLoc,
        scaleRatioLoc: scaleRatioLoc,
        centerLoc: centerLoc,
        pointSizeLoc: pointSizeLoc,
        colorLoc: colorLoc
      };
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      gl.getExtension("OES_element_index_uint");
      Grid.render(gl); // TODO
    } else {
      cx = this.drawingContext;
      gl = cx.gl;
    }
    if (Geometry.render(gl)) { // TODO
      this.isDrawingNeeded = true;
    }
    if (cx.pixelRatio !== window.devicePixelRatio) { // TODO
      this.isDrawingNeeded = true;
      cx.pixelRatio = window.devicePixelRatio;
    }
  },

  onAnimationFrameReceived: function () {
    if (!this.drawingContext) {
      return;
    }
    this.isAnimationFrameRequested = requestAnimationFrame(this.onAnimationFrameReceived);
    var cx = this.drawingContext;
    var gl = cx.gl;
    var canvas = document.getElementById("map-canvas"); // TODO
    var clientWidth = canvas.clientWidth;
    var clientHeight = canvas.clientHeight;
    var deviceWidth = cx.pixelRatio * clientWidth;
    var deviceHeight = cx.pixelRatio * clientHeight;
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

      gl.uniform2f(cx.pixelFitLoc, 1 / (clientWidth * 2), 1 / (clientHeight * 2));
      gl.uniform2f(cx.scaleRatioLoc,
        defs.baseClientTileSize / (zoomLevel * defs.tileSize) / (clientWidth / 2),
        defs.baseClientTileSize / (zoomLevel * defs.tileSize) / (clientHeight / 2));
      gl.uniform2f(cx.centerLoc, centerX, centerY);

      gl.clear(gl.COLOR_BUFFER_BIT);

      // Draw grid
      gl.lineWidth(1);
      gl.uniform4f(cx.colorLoc, 0.2, 0.2, 0.2, 1);
      Grid.draw(gl, cx.vertexLoc); // TODO

      if (Geometry.bindVertexBuffer(gl)) { // TODO
        gl.enableVertexAttribArray(cx.vertexLoc);
        gl.vertexAttribPointer(cx.vertexLoc, 2, gl.FLOAT, false, 0, 0);

        // Draw road links
        var baseRoadLinkSize = 2 * cx.pixelRatio;
        var roadLinkSize = baseRoadLinkSize * Math.sqrt(zoomLevel) / zoomLevel;
        var roadLinkAlpha = Math.min(roadLinkSize, 1);
        gl.lineWidth(roadLinkSize);
        gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadLinkAlpha);
        Geometry.drawRoadLinks(gl); // TODO
        gl.uniform4f(cx.colorLoc, 1, 1, 1, 1);
        this.hoveredRoadLinkIndices.draw(gl, gl.LINES); // TODO
        gl.uniform4f(cx.colorLoc, 1, 0.4, 0, 1);
        this.selectedRoadLinkIndices.draw(gl, gl.LINES); // TODO

        // Draw road nodes
        var baseRoadNodeSize = 8 * cx.pixelRatio;
        var roadNodeSize = baseRoadNodeSize * Math.cbrt(zoomLevel) / zoomLevel;
        var roadNodeAlpha = Math.min(roadNodeSize, 1);
        gl.uniform1f(cx.pointSizeLoc, roadNodeSize);
        gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadNodeAlpha);
        Geometry.drawRoadNodes(gl); // TODO
        gl.uniform4f(cx.colorLoc, 1, 1, 1, 1);
        this.hoveredRoadNodeIndices.draw(gl, gl.POINTS); // TODO
        gl.uniform4f(cx.colorLoc, 1, 0.4, 0, 1);
        this.selectedRoadNodeIndices.draw(gl, gl.POINTS); // TODO
      }
    }
  }
};

r.makeComponent("App", module);
