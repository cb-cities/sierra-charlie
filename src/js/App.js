"use strict";

const r = require("react-wrapper");

const EasedStateMixin = require("./EasedStateMixin");
const compute = require("./compute");
const defs = require("./defs");

const webgl = require("./lib/webgl");
const fragmentShader = require("../glsl/fragment-shader.glsl");
const vertexShader = require("../glsl/vertex-shader.glsl");


module.exports = {
  mixins: [EasedStateMixin],

  getInitialState: function () {
    return {
      centerX: defs.defaultCenterX,
      centerY: defs.defaultCenterY,
      zoom: defs.defaultZoom,
      rawTime: 10 + 9 / 60
    };
  },

  setStaticCenter: function (centerX, centerY) {
    this.setState({
        centerX: centerX,
        centerY: centerY
      });
  },

  setCenterX: function (centerX, duration, easing) {
    this.isEasingCenterX = true;
    this.setEasedState("centerX", centerX, duration, easing, function () {
        this.isEasingCenterX = false;
      }.bind(this));
  },

  setCenterY: function (centerY, duration, easing) {
    this.isEasingCenterY = true;
    this.setEasedState("centerY", centerY, duration, easing, function () {
        this.isEasingCenterY = false;
      }.bind(this));
  },

  setCenter: function (p, duration, easing) {
    this.setCenterX(p[0], duration, easing);
    this.setCenterY(p[1], duration, easing);
  },

  setZoom: function (zoom, duration, easing) {
    this.isEasingZoom = true;
    this.setEasedState("zoom", zoom, duration, easing, function () {
        this.isEasingZoom = false;
      }.bind(this));
  },

  computeScaleX: function (newCenterX) { // TODO: Refactor
    const clientWidth = Controller.getClientWidth(); // TODO
    const centerX = this.getCenterX();
    const zoom = this.getZoom();
    const pageWidth = compute.fromClientSize(clientWidth, zoom);
    const diff = Math.abs(newCenterX - centerX);
    return Math.sqrt(1 + diff / pageWidth);
  },

  computeScaleY: function (newCenterY) { // TODO: Refactor
    const clientHeight = Controller.getClientHeight(); // TODO
    const centerY = this.getCenterY();
    const zoom = this.getZoom();
    const pageHeight = compute.fromClientSize(clientHeight, zoom);
    const diff = Math.abs(newCenterY - centerY);
    return Math.sqrt(1 + diff / pageHeight);
  },

  computeScaleZoom: function (newZoom) { // TODO: Refactor
    const zoom = this.getZoom();
    const diff = Math.abs(newZoom - zoom);
    return 1 + diff / 10;
  },

  adaptiveSetCenterX: function (newCenterX, duration) {
    const scaleX = this.computeScaleX(newCenterX);
    this.setCenterX(newCenterX, duration * scaleX);
  },

  adaptiveSetCenterY: function (newCenterY, duration) {
    const scaleY = this.computeScaleY(newCenterY);
    this.setCenterY(newCenterY, duration * scaleY);
  },

  adaptiveSetCenter: function (newCenter, duration) {
    const scaleX = this.computeScaleX(newCenter[0]);
    const scaleY = this.computeScaleY(newCenter[1]);
    const scale = Math.max(scaleX, scaleY);
    this.setCenterX(newCenter[0], duration * scale);
    this.setCenterY(newCenter[1], duration * scale);
  },

  adaptiveSetZoom: function (newZoom, duration) {
    const scaleZoom = this.computeScaleZoom(newZoom);
    this.setZoom(newZoom, duration * scaleZoom);
  },

  adaptiveSetCenterAndZoom: function (newCenter, newZoom, duration) {
    const scaleX = this.computeScaleX(newCenter[0]);
    const scaleY = this.computeScaleY(newCenter[1]);
    const scaleZoom = this.computeScaleZoom(newZoom);
    const scale = Math.max(scaleX, scaleY, scaleZoom);
    const zoom = this.getZoom();
    if (newZoom <= zoom) {
      this.setCenter(newCenter, duration * scale);
      this.setZoom(newZoom, duration * scale, "reverse");
    } else if (newZoom > zoom) {
      this.setCenter(newCenter, duration * scale, "reverse");
      this.setZoom(newZoom, duration * scale);
    }
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
    this.updateSpaceAndFrame();
    this.startDrawing();
  },

  componentDidUpdate: function () {
    this.updateSpaceAndFrame();
    this.isDrawingNeeded = true;
  },

  updateSpaceAndFrame: function () {
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
      const program = webgl.createProgram(gl, vertexShader, fragmentShader);
      gl.useProgram(program);
      const vertexLoc = gl.getAttribLocation(program, "vertex");
      const scaleRatioLoc = gl.getUniformLocation(program, "scaleRatio");
      const centerLoc = gl.getUniformLocation(program, "center");
      const pointSizeLoc = gl.getUniformLocation(program, "pointSize");
      const colorLoc = gl.getUniformLocation(program, "color");
      cx = this.drawingContext = {
        gl: gl,
        program: program,
        pixelRatio: window.devicePixelRatio,
        vertexLoc: vertexLoc,
        scaleRatioLoc: scaleRatioLoc,
        centerLoc: centerLoc,
        pointSizeLoc: pointSizeLoc,
        colorLoc: colorLoc
      };
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      gl.getExtension("OES_element_index_uint");
      Controller.grid.render(gl);
      Controller.modeLines.render(gl, gl.DYNAMIC_DRAW);
      Controller.highlightedPoints.render(gl, gl.DYNAMIC_DRAW);
      Controller.highlightedLines.render(gl, gl.DYNAMIC_DRAW);
      Controller.selectedPoints.render(gl, gl.DYNAMIC_DRAW);
      Controller.selectedLines.render(gl, gl.DYNAMIC_DRAW);
      Controller.routingPoints.render(gl, gl.DYNAMIC_DRAW);
      Controller.routingLines.render(gl, gl.DYNAMIC_DRAW);
    } else {
      cx = this.drawingContext;
      gl = cx.gl;
    }
    if (Geometry.render(gl)) {
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
    const canvas = document.getElementById("map-canvas");
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
      const baseRoadLinkSize = cx.pixelRatio * 2;
      const roadLinkSize = baseRoadLinkSize * Math.sqrt(zoomLevel) / zoomLevel;
      const roadLinkAlpha = Math.min(roadLinkSize, 1);
      const baseRoadNodeSize = cx.pixelRatio * 8;
      const roadNodeSize = baseRoadNodeSize * Math.cbrt(zoomLevel) / zoomLevel;
      const roadNodeAlpha = Math.min(roadNodeSize, 1);

      gl.uniform2f(cx.scaleRatioLoc,
        defs.baseClientTileSize / (zoomLevel * defs.tileSize) / (clientWidth / 2),
        defs.baseClientTileSize / (zoomLevel * defs.tileSize) / (clientHeight / 2));
      gl.uniform2f(cx.centerLoc, centerX, centerY);

      gl.clear(gl.COLOR_BUFFER_BIT);

      // Draw grid
      gl.lineWidth(1);
      gl.uniform4f(cx.colorLoc, 0.2, 0.2, 0.2, 1);
      Controller.grid.draw(gl, cx.vertexLoc);

      if (Geometry.bindVertexBuffer(gl)) {
        gl.enableVertexAttribArray(cx.vertexLoc); // TODO
        gl.vertexAttribPointer(cx.vertexLoc, 2, gl.FLOAT, false, 0, 0); // TODO

        // Draw road links
        gl.lineWidth(roadLinkSize);
        gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadLinkAlpha);
        Geometry.drawAllRoadLinks(gl);

        // Draw road nodes
        gl.uniform1f(cx.pointSizeLoc, roadNodeSize);
        gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadNodeAlpha);
        Geometry.drawAllRoadNodes(gl);

        // Draw special lines
        gl.lineWidth(Math.max(roadLinkSize, cx.pixelRatio));
        gl.uniform4f(cx.colorLoc, 0, 0, 1, 1);
        Controller.routingLines.draw(gl, cx.vertexLoc);
        // gl.uniform4f(cx.colorLoc, 1, 0.4, 0, 1);
        // Controller.selectedLines.draw(gl, cx.vertexLoc);
        // gl.uniform4f(cx.colorLoc, 1, 1, 1, 1);
        // Controller.highlightedLines.draw(gl, cx.vertexLoc);

        // Draw special points
        gl.uniform1f(cx.pointSizeLoc, Math.max(roadNodeSize, cx.pixelRatio * 2));
        gl.uniform4f(cx.colorLoc, 0, 0, 1, 1);
        Controller.routingPoints.draw(gl, cx.vertexLoc);
        // gl.uniform4f(cx.colorLoc, 1, 0.4, 0, 1);
        // Controller.selectedPoints.draw(gl, cx.vertexLoc);
        // gl.uniform4f(cx.colorLoc, 1, 1, 1, 1);
        // Controller.highlightedPoints.draw(gl, cx.vertexLoc);

        Geometry.bindVertexBuffer(gl, cx.vertexLoc);
        gl.enableVertexAttribArray(cx.vertexLoc); // TODO
        gl.vertexAttribPointer(cx.vertexLoc, 2, gl.FLOAT, false, 0, 0); // TODO

        // Draw special road links
        gl.uniform4f(cx.colorLoc, 0, 0.6, 1, 1);
        Controller.routingLineIndices.draw(gl, gl.LINES);
        gl.uniform4f(cx.colorLoc, 1, 0, 0, 1);
        Controller.deletedLineIndices.draw(gl, gl.LINES);
        gl.uniform4f(cx.colorLoc, 1, 0.4, 0, 1);
        Controller.selectedLineIndices.draw(gl, gl.LINES);
        gl.uniform4f(cx.colorLoc, 1, 1, 1, 1);
        Controller.highlightedLineIndices.draw(gl, gl.LINES);

        // Draw special road nodes
        gl.uniform4f(cx.colorLoc, 0, 0.6, 1, 1);
        Controller.routingPointIndices.draw(gl, gl.POINTS);
        gl.uniform4f(cx.colorLoc, 1, 0, 0, 1);
        Controller.deletedPointIndices.draw(gl, gl.POINTS);
        gl.uniform4f(cx.colorLoc, 1, 0.4, 0, 1);
        Controller.selectedPointIndices.draw(gl, gl.POINTS);
        gl.uniform4f(cx.colorLoc, 1, 1, 1, 1);
        Controller.highlightedPointIndices.draw(gl, gl.POINTS);

        // Draw mode lines
        if (Controller.prevCursor) {
          switch (Controller.mode) {
            case "GetRoute":
              gl.uniform4f(cx.colorLoc, 0, 0.6, 1, 1);
              break;
            case "AskGoogleForRoute":
              gl.uniform4f(cx.colorLoc, 0, 0, 1, 1);
              break;
            default:
              gl.uniform4f(cx.colorLoc, 1, 1, 1, 1);
          }
          Controller.modeLines.draw(gl, cx.vertexLoc);
        }
      }
    }
  }
};

r.makeComponent("App", module);
