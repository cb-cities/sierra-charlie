"use strict";

const r = require("react-wrapper");

const EasedStateMixin = require("./EasedStateMixin");
const compute = require("./compute");
const defs = require("./defs");

const glUtils = require("./gl-utils"); // TODO
const fragmentShader = require("../glsl/fragment-shader.glsl");
const vertexShader = require("../glsl/vertex-shader.glsl");


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
    this.highlightedPointIndices = Controller.highlightedPointIndices; // TODO
    this.highlightedLineIndices = Controller.highlightedLineIndices; // TODO
    this.selectedPointIndices = Controller.selectedPointIndices; // TODO
    this.selectedLineIndices = Controller.selectedLineIndices; // TODO

    this.updateFrameSpace();
    this.startDrawing();
  },

  componentDidUpdate: function () {
    this.updateFrameSpace();
    this.isDrawingNeeded = true;
  },

  updateFrameSpace: function () {
    const centerX = this.getCenterX();
    const centerY = this.getCenterY();
    const zoom = this.getZoom();
    this.updateSpace(zoom);
    this.updateFrame(centerX, centerY, zoom);
  },

  updateFrame: function (centerX, centerY, zoom) {
    const newScrollLeft = compute.scrollLeftFromCenterX(centerX, zoom);
    const newScrollTop = compute.scrollTopFromCenterY(centerY, zoom);
    if (this.prevScrollLeft !== newScrollLeft || this.prevScrollTop !== newScrollTop) {
      const frame = document.getElementById("map-frame");
      frame.scrollLeft = newScrollLeft;
      frame.scrollTop = newScrollTop;
      this.prevScrollLeft = newScrollLeft;
      this.prevScrollTop = newScrollTop;
    }
  },

  updateSpace: function (zoom) {
    const newWidth = compute.totalClientWidth(zoom);
    const newHeight = compute.totalClientHeight(zoom);
    if (this.prevWidth !== newWidth || this.prevHeight !== newHeight) {
      const space = document.getElementById("map-space");
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
    this.renderContents();
  },

  renderContents: function () {
    let gl, cx;
    if (!this.drawingContext) {
      this.isDrawingNeeded = true;
      const canvas = document.getElementById("map-canvas");
      gl = canvas.getContext("webgl", {
          alpha: false
        });
      const program = glUtils.createProgram(gl, vertexShader, fragmentShader);
      gl.useProgram(program);
      const vertexLoc = gl.getAttribLocation(program, "vertex");
      const pixelFitLoc = gl.getUniformLocation(program, "pixelFit");
      const scaleRatioLoc = gl.getUniformLocation(program, "scaleRatio");
      const centerLoc = gl.getUniformLocation(program, "center");
      const pointSizeLoc = gl.getUniformLocation(program, "pointSize");
      const colorLoc = gl.getUniformLocation(program, "color");
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
    const cx = this.drawingContext;
    const gl = cx.gl;
    const canvas = document.getElementById("map-canvas"); // TODO
    const clientWidth = canvas.clientWidth;
    const clientHeight = canvas.clientHeight;
    const deviceWidth = cx.pixelRatio * clientWidth;
    const deviceHeight = cx.pixelRatio * clientHeight;
    if (canvas.width !== deviceWidth || canvas.height !== deviceHeight) {
      this.isDrawingNeeded = true;
      canvas.width = deviceWidth;
      canvas.height = deviceHeight;
      gl.viewport(0, 0, deviceWidth, deviceHeight);
    }
    if (this.isDrawingNeeded) {
      this.isDrawingNeeded = false;
      const centerX = this.getCenterX();
      const centerY = this.getCenterY();
      const zoom = this.getZoom();
      // const time = compute.time(this.getRawTime());
      const zoomLevel = compute.zoomLevel(zoom);

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
        const baseRoadLinkSize = cx.pixelRatio * 2;
        const roadLinkSize = baseRoadLinkSize * Math.sqrt(zoomLevel) / zoomLevel;
        const roadLinkAlpha = Math.min(roadLinkSize, 1);
        gl.lineWidth(roadLinkSize);
        gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadLinkAlpha);
        Geometry.drawAllRoadLinks(gl); // TODO
        gl.uniform4f(cx.colorLoc, 1, 0.4, 0, 1);
        this.selectedLineIndices.draw(gl, gl.LINES); // TODO
        gl.uniform4f(cx.colorLoc, 1, 1, 1, 1);
        this.highlightedLineIndices.draw(gl, gl.LINES); // TODO

        // Draw road nodes
        const baseRoadNodeSize = cx.pixelRatio * 8;
        const roadNodeSize = baseRoadNodeSize * Math.cbrt(zoomLevel) / zoomLevel;
        const roadNodeAlpha = Math.min(roadNodeSize, 1);
        gl.uniform1f(cx.pointSizeLoc, roadNodeSize);
        gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadNodeAlpha);
        Geometry.drawAllRoadNodes(gl); // TODO
        gl.uniform4f(cx.colorLoc, 1, 0.4, 0, 1);
        this.selectedPointIndices.draw(gl, gl.POINTS); // TODO
        gl.uniform4f(cx.colorLoc, 1, 1, 1, 1);
        this.highlightedPointIndices.draw(gl, gl.POINTS); // TODO
      }
    }
  }
};

r.makeComponent("App", module);
