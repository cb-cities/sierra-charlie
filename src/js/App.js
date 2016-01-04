"use strict";

var easeTween = require("ease-tween");
var reactTweenState = require("react-tween-state");
var r = require("react-wrapper");

var compute = require("./compute");



var GeometryLoader = require("worker?inline!./geometry-loader");
var Indexset = require("./indexset");
var Lineset = require("./lineset");
var Quadtree = require("./quadtree");
var Polyquadtree = require("./polyquadtree");
var defs = require("./defs");
var glUtils = require("./gl-utils");
var polyline = require("./polyline");
var vector = require("./vector");
var stats = require("./stats");
var rect = require("./rect");

var fragmentShader = require("../glsl/fragment-shader.glsl");
var vertexShader = require("../glsl/vertex-shader.glsl");


module.exports = {
  mixins: [reactTweenState.Mixin],

  getInitialState: function () {
    return {
      left: 0.4897637424698795,
      top: 0.4768826844262295,
      zoom: 5,
      rawTime: 10 + 9 / 60
    };
  },

  componentDidMount: function () {
    var frame = document.getElementById("map-frame");
    var canvas = document.getElementById("map-canvas");
    var space = document.getElementById("map-space");
    frame.addEventListener("scroll", this.onScroll);
    canvas.addEventListener("webglcontextlost", this.onLoseContext);
    canvas.addEventListener("webglcontextrestored", this.onRestoreContext);

    space.addEventListener("mousemove", this.onMouseMove);
    addEventListener("resize", this.onResize);

    this.startGeometryLoader();
    this.startPainter();
    var left = this.getEasedState("left");
    var top = this.getEasedState("top");
    var zoom = this.getEasedState("zoom");
    this.updateSpace(zoom);
    this.updateFrame(left, top, zoom);
    this.easeCounts = {};
  },

  componentDidUpdate: function () {
    this.needsPainting = true;
    var left = this.getEasedState("left");
    var top = this.getEasedState("top");
    var zoom = this.getEasedState("zoom");
    this.updateSpace(zoom);
    this.updateFrame(left, top, zoom);
  },

  updateFrame: function (left, top, zoom) {
    var newScrollLeft = compute.frameScrollLeft(left, zoom);
    var newScrollTop = compute.frameScrollTop(top, zoom);
    if (this.frameScrollLeft !== newScrollLeft) {
      var frame = document.getElementById("map-frame");
      frame.scrollLeft = newScrollLeft;
      frame.scrollTop = newScrollTop;
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


  setEasedState: function (stateKey, value, duration, cb) {
    if (!this.easeCounts[stateKey]) {
      this.easeCounts[stateKey] = 1;
    } else {
      this.easeCounts[stateKey]++;
    }
    this.tweenState(stateKey, {
        endValue: value,
        duration: duration,
        easing: function (elapsed, from, to) {
          return from + (to - from) * easeTween.ease(elapsed / duration);
        },
        onEnd: function () {
          if (!--this.easeCounts[stateKey]) {
            cb();
          }
        }.bind(this)
      });
  },

  setLeft: function (left, duration) {
    this.easingLeft = true;
    this.setEasedState("left", left, duration, function () {
        this.easingLeft = false;
      }.bind(this));
  },

  setTop: function (top, duration) {
    this.easingTop = true;
    this.setEasedState("top", top, duration, function () {
        this.easingTop = false;
      }.bind(this));
  },

  setZoom: function (zoom, duration) {
    this.easingZoom = true;
    this.setEasedState("zoom", zoom, duration, function () {
        this.easingZoom = false;
      }.bind(this));
  },

  setRawTime: function (rawTime, duration) {
    this.easingRawTime = true;
    this.setEasedState("rawTime", rawTime, duration, function () {
        this.easingRawTime = false;
      }.bind(this));
  },

  getEasedState: function (stateKey) {
    return this.getTweeningValue(stateKey);
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

  getClientWidth: function () {
    var canvas = document.getElementById("map-canvas");
    return canvas.clientWidth;
  },

  getClientHeight: function () {
    var canvas = document.getElementById("map-canvas");
    return canvas.clientHeight;
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


  startGeometryLoader: function () {
    this.vertices = new Float32Array(defs.maxVertexCount * 2);
    this.vertexCount = 0;
    this.roadNodes = {};
    this.roadNodeIndices = new Uint32Array(defs.maxRoadNodeIndexCount);
    this.roadNodeIndexCount = 0;
    this.roadLinks = {};
    this.roadLinkIndices = new Uint32Array(defs.maxRoadLinkIndexCount);
    this.roadLinkIndexCount = 0;

    this.roadNodeTree = new Quadtree(465464, 112964, 131072, this.getRoadNodePoint); // TODO
    this.roadLinkTree = new Polyquadtree(465464, 112964, 131072, this.getRoadLinkBounds);

    this.hoveredRoadNodes = new Indexset(); // TODO
    this.hoveredRoadLinks = new Indexset();

    // this.roadNodeTreeLines = new Lineset(); // TODO
    // this.roadLinkTreeLines = new Lineset();

    this.geometryLoader = new GeometryLoader();
    this.geometryLoader.addEventListener("message", this.onMessage);
    this.geometryLoader.postMessage({
        message: "start",
        origin: location.origin
      });
  },

  getRoadNodePoint: function (roadNode) {
    return {
      x: this.vertices[roadNode.vertexOffset * 2],
      y: this.vertices[roadNode.vertexOffset * 2 + 1]
    };
  },

  getRoadLinkBounds: function (roadLink) {
    var result = {
      left: Infinity,
      top: Infinity,
      right: -Infinity,
      bottom: -Infinity
    };
    for (var i = 0; i < roadLink.pointCount; i++) {
      var k = roadLink.vertexOffset + i;
      result = rect.stretch(result, {
          x: this.vertices[2 * k],
          y: this.vertices[2 * k + 1]
        });
    }
    return result;
  },

  stopGeometryLoader: function () {
    this.geometryLoader.removeEventListener("message", this.onMessage);
    this.geometryLoader.terminate();
  },

  onMessage: function (event) {
    switch (event.data.message) {
      case "loadRoadNodes":
        this.onLoadRoadNodes(event.data);
        break;
      case "loadRoadLinks":
        this.onLoadRoadLinks(event.data);
        break;
    }
  },

  onLoadRoadNodes: function (data) {
    this.vertices.set(data.vertices, this.vertexCount * 2);
    this.vertexCount += data.vertices.length / 2;
    this.roadNodeIndices.set(data.roadNodeIndices, this.roadNodeIndexCount);
    this.roadNodeIndexCount += data.roadNodeIndices.length;
    for (var i = 0; i < data.roadNodes.length; i++) {
      var roadNode = data.roadNodes[i];
      this.roadNodes[roadNode.toid] = roadNode;
      this.roadNodeTree.insert(roadNode);
    }
    if (this.vertexCount === defs.maxVertexCount) {
      this.stopGeometryLoader();
    }
    this.updatePainterContext();
    UI.ports.setVertexCount.send(this.vertexCount);

    // var gl = this.painterContext.gl; // TODO
    // this.roadNodeTreeLines.clear();
    // this.roadNodeTree.extendLineset(this.roadNodeTreeLines);
    // this.roadNodeTreeLines.render(gl, gl.STATIC_DRAW);

    // var s = this.roadNodeTree.extendStats({itemCounts: [], nodeSizes: []});
    // console.log("RN item counts\n", stats.dump(s.itemCounts));
    // console.log("RN node sizes\n", stats.dump(s.nodeSizes));
    // console.log("RN tree size: ", s.nodeSizes.length);
  },

  onLoadRoadLinks: function (data) {
    this.vertices.set(data.vertices, this.vertexCount * 2);
    this.vertexCount += data.vertices.length / 2;
    this.roadLinkIndices.set(data.roadLinkIndices, this.roadLinkIndexCount);
    this.roadLinkIndexCount += data.roadLinkIndices.length;
    for (var i = 0; i < data.roadLinks.length; i++) {
      var roadLink = data.roadLinks[i];
      this.roadLinks[roadLink.toid] = roadLink;
      this.roadLinkTree.insert(roadLink);
    }
    if (this.vertexCount === defs.maxVertexCount) {
      this.stopGeometryLoader();
    }
    this.updatePainterContext();
    UI.ports.setVertexCount.send(this.vertexCount);

    // var gl = this.painterContext.gl; // TODO
    // this.roadLinkTreeLines.clear();
    // this.roadLinkTree.extendLineset(this.roadLinkTreeLines);
    // this.roadLinkTreeLines.render(gl, gl.STATIC_DRAW);

    // var s = this.roadLinkTree.extendStats({itemCounts: [], nodeSizes: []});
    // console.log("RL item counts\n", stats.dump(s.itemCounts));
    // console.log("RL node sizes\n", stats.dump(s.nodeSizes));
    // console.log("RL tree size: ", s.nodeSizes.length);
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
      var vertexBuf = gl.createBuffer();
      var roadNodeIndexBuf = gl.createBuffer();
      var roadLinkIndexBuf = gl.createBuffer();
      var positionLoc = gl.getAttribLocation(program, "a_position");
      var resolutionLoc = gl.getUniformLocation(program, "u_resolution");
      var dilationLoc = gl.getUniformLocation(program, "u_dilation");
      var translationLoc = gl.getUniformLocation(program, "u_translation");
      var pointSizeLoc = gl.getUniformLocation(program, "u_pointSize");
      var colorLoc = gl.getUniformLocation(program, "u_color");
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
    if (cx.vertexCount !== this.vertexCount) {
      this.needsPainting = true;
      gl.bindBuffer(gl.ARRAY_BUFFER, cx.vertexBuf);
      gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
      cx.vertexCount = this.vertexCount;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cx.roadNodeIndexBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.roadNodeIndices, gl.STATIC_DRAW);
      cx.roadNodeIndexCount = this.roadNodeIndexCount;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cx.roadLinkIndexBuf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.roadLinkIndices, gl.STATIC_DRAW);
      cx.roadLinkIndexCount = this.roadLinkIndexCount;
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
      var left = this.getEasedState("left");
      var top = this.getEasedState("top");
      var zoom = this.getEasedState("zoom");
      // var time = compute.time(this.getEasedState("rawTime"));
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

      gl.bindBuffer(gl.ARRAY_BUFFER, cx.vertexBuf);
      gl.enableVertexAttribArray(cx.positionLoc);
      gl.vertexAttribPointer(cx.positionLoc, 2, gl.FLOAT, false, 0, 0);

      // Draw road links
      var roadLinkSize = 2 * cx.devicePixelRatio / zoomLevel * Math.sqrt(zoomLevel);
      var roadLinkAlpha = Math.min(roadLinkSize, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cx.roadLinkIndexBuf);
      gl.lineWidth(roadLinkSize);
      gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadLinkAlpha);
      gl.drawElements(gl.LINES, cx.roadLinkIndexCount, gl.UNSIGNED_INT, 0);
      gl.uniform4f(cx.colorLoc, 1, 0, 0, 1);
      this.hoveredRoadLinks.draw(gl, gl.LINES);

      // Draw road nodes
      var roadNodeSize = 8 * cx.devicePixelRatio / zoomLevel * Math.cbrt(zoomLevel);
      var roadNodeAlpha = Math.min(roadNodeSize, 1);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cx.roadNodeIndexBuf);
      gl.uniform1f(cx.pointSizeLoc, roadNodeSize);
      gl.uniform4f(cx.colorLoc, 0.6, 0.6, 0.6, roadNodeAlpha);
      gl.drawElements(gl.POINTS, cx.roadNodeIndexCount, gl.UNSIGNED_INT, 0);
      gl.uniform4f(cx.colorLoc, 1, 0, 0, 1);
      this.hoveredRoadNodes.draw(gl, gl.POINTS);

      // gl.lineWidth(1);
      // gl.uniform4f(cx.colorLoc, 1, 0, 0, 1);
      // this.roadNodeTreeLines.draw(gl, cx.positionLoc);
      // gl.uniform4f(cx.colorLoc, 0, 1, 0, 1);
      // this.roadLinkTreeLines.draw(gl, cx.positionLoc);
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






  onScroll: function (event) {
    if (!this.easingLeft && !this.easingTop && !this.easingZoom) {
      var frame = document.getElementById("map-frame");
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



  fromClientPoint: function(clientX, clientY) {
    var canvas = document.getElementById("map-canvas");
    var left = this.getEasedState("left");
    var top = this.getEasedState("top");
    var zoom = this.getEasedState("zoom");
    var zoomLevel = compute.zoomLevel(zoom);
    var dilation = defs.tileSize / defs.imageSize * zoomLevel; // TODO: Compare with drawing
    var translationX = (defs.firstTileX + left * defs.tileXCount) * defs.tileSize;
    var translationY = (defs.lastTileY + 1 - top * defs.tileYCount) * defs.tileSize;
    return {
      x: (clientX - canvas.clientWidth / 2) * dilation + translationX,
      y: ((canvas.clientHeight - clientY) - canvas.clientHeight / 2) * dilation + translationY
    };
  },

  fromClientRect: function (clientR) {
    var bottomLeft = this.fromClientPoint(clientR.left, clientR.top);
    var topRight = this.fromClientPoint(clientR.right, clientR.bottom);
    return {
      left: bottomLeft.x,
      top: topRight.y,
      right: topRight.x,
      bottom: bottomLeft.y
    };
  },

  onMouseMove: function (event) {
    // console.log("mouseMove", event.clientX, event.clientY);
    this.needsPainting = true;

    var cursor =
      this.fromClientRect(
        vector.bounds(6, {
            x: event.clientX,
            y: event.clientY
          }));

    var roadNodeItems = this.roadNodeTree.select(cursor);
    this.hoveredRoadNodes.clear();
    for (var i = 0; i < roadNodeItems.length; i++) {
      this.hoveredRoadNodes.insert(roadNodeItems[i].vertexOffset);
    }

    var roadLinkItems = this.roadLinkTree.select(cursor);
    this.hoveredRoadLinks.clear();
    for (var i = 0; i < roadLinkItems.length; i++) {
      this.hoveredRoadLinks.insertFromArray(this.roadLinkIndices, roadLinkItems[i].indexOffset, (roadLinkItems[i].pointCount - 1) * 2);
    }

    var gl = this.painterContext.gl;
    this.hoveredRoadNodes.render(gl, gl.STREAM_DRAW);
    this.hoveredRoadLinks.render(gl, gl.STREAM_DRAW);
  }
};

r.makeComponent("App", module);
