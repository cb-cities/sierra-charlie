"use strict";

var GeometryLoader = require("worker?inline!./geometry-loader");
var Quadtree = require("./lib/quadtree");
var Rect = require("./lib/rect");
var Lineset = require("./lib/lineset");
var Indexset = require("./lib/indexset");

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
      zoom:    5,
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
  

  // TODO: Refactor
  prepareGrid: function (gl) {
    var left = defs.firstTileX * defs.tileSize;
    var top = defs.firstTileY * defs.tileSize;
    var right = (defs.lastTileX + 1) * defs.tileSize;
    var bottom = (defs.lastTileY + 1) * defs.tileSize;
    this.gridLines = new Lineset();
    for (var x = left; x <= right; x += defs.tileSize) {
      this.gridLines.insert(x, top, x, bottom);
    }
    for (var y = bottom; y >= top; y -= defs.tileSize) {
      this.gridLines.insert(left, y, right, y);
    }
    this.gridLines.render(gl, gl.STATIC_DRAW);
  },
  
  
  startGeometryLoader: function () {
    this.vertices = new Float32Array(defs.maxVertexCount * 2);
    this.vertexCount = 0;
    this.roadNodes = {};
    this.roadNodeIndices = new Uint32Array(defs.maxRoadNodeIndexCount);
    this.roadNodeIndexCount = 0;
    this.roadNodeTree = new Quadtree(465464, 112964, 131072); // TODO
    this.roadLinks = {};
    this.roadLinkIndices = new Uint32Array(defs.maxRoadLinkIndexCount);
    this.roadLinkIndexCount = 0;
    
    this.hoveredRoadNodes = new Indexset(); // TODO
    this.hoveredRoadLinks = new Indexset();
    
    this.roadNodeTreeLines = new Lineset(); // TODO
    
    this.geometryLoader = new GeometryLoader();
    this.geometryLoader.addEventListener("message", this.onMessage);
    this.geometryLoader.postMessage({
        message: "start",
        origin: location.origin
      });
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
      var p = {
         x: this.vertices[2 * roadNode.vertexOffset],
         y: this.vertices[2 * roadNode.vertexOffset + 1]
      };
      // UI.ports.addRoadNode.send([p, roadNode.toid]);
      this.roadNodeTree.insert({
          p: p,
          roadNode: roadNode
        });
    }
    if (this.vertexCount === defs.maxVertexCount) {
      this.stopGeometryLoader();
    }
    this.updatePainterContext();
    UI.ports.setVertexCount.send(this.vertexCount);
    var gl = this.painterContext.gl; // TODO
    this.roadNodeTree.extendLineset(this.roadNodeTreeLines);
    this.roadNodeTreeLines.render(gl, gl.STATIC_DRAW);
  },
  
  onLoadRoadLinks: function (data) {
    this.vertices.set(data.vertices, this.vertexCount * 2);
    this.vertexCount += data.vertices.length / 2;
    this.roadLinkIndices.set(data.roadLinkIndices, this.roadLinkIndexCount);
    this.roadLinkIndexCount += data.roadLinkIndices.length;
    for (var i = 0; i < data.roadLinks.length; i++) {
      var roadLink = data.roadLinks[i];
      this.roadLinks[roadLink.toid] = roadLink;
      // for (var j = 0; j < roadLink.pointCount; j++) {
      //   var k = roadLink.vertexOffset + j;
      //   var p = {
      //     x: this.vertices[2 * k],
      //     y: this.vertices[2 * k + 1]
      //   };
      // }
      // if (Math.random() < 0.1) {
      //   this.hoveredRoadLinks.insertFromArray(this.roadLinkIndices, roadLink.indexOffset, (roadLink.pointCount - 1) * 2);
      // }
    }
    // var gl = this.painterContext.gl; // TODO
    // this.hoveredRoadLinks.render(gl, gl.STATIC_DRAW);
    if (this.vertexCount === defs.maxVertexCount) {
      this.stopGeometryLoader();
    }
    this.updatePainterContext();
    UI.ports.setVertexCount.send(this.vertexCount);
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
    var frame = r.domNode(this);
    var canvas = frame.firstChild;
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
      
      // Draw road node tree
      gl.lineWidth(1);
      gl.uniform4f(cx.colorLoc, 1, 0, 0, 1);
      this.roadNodeTreeLines.draw(gl, cx.positionLoc);
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
    this.needsPainting = true;
  },
  
  render: function () {
    var zoom = this.getEasedState("zoom");
    return (
      r.div({
          id: "map-frame"
        },
        r.canvas({
          id: "map-canvas"
        }),
        r.div({
            id: "map-space",
            style: {
              width:  compute.spaceWidth(zoom),
              height: compute.spaceHeight(zoom)
            },
            onDoubleClick: this.onDoubleClick,
            onMouseMove: this.onMouseMove
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
          this.setZoom(Math.max(0, Math.min(zoom, defs.maxZoom)), duration);
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
  },
  


  fromClientPoint: function(x, y) {
    var frame = r.domNode(this);
    var canvas = frame.firstChild;
    var left = this.getEasedState("left");
    var top = this.getEasedState("top");
    var zoom = this.getEasedState("zoom");
    var zoomLevel = compute.zoomLevel(zoom);
    var dilation = defs.tileSize / defs.imageSize * zoomLevel; // TODO: Compare with drawing
    var translationX = (defs.firstTileX + left * defs.tileXCount) * defs.tileSize;
    var translationY = (defs.lastTileY + 1 - top * defs.tileYCount) * defs.tileSize;
    return {
      x: (x - canvas.clientWidth / 2) * dilation + translationX,
      y: ((canvas.clientHeight - y) - canvas.clientHeight / 2) * dilation + translationY
    };
  },
  
  fromClientRect: function (left, top, right, bottom) {
    var topLeft = this.fromClientPoint(left, top);
    var bottomRight = this.fromClientPoint(right, bottom);
    return new Rect(topLeft.x, bottomRight.y, bottomRight.x, topLeft.y)
  },

  onMouseMove: function (event) {
    // console.log("mouseMove", event.clientX, event.clientY);
    this.needsPainting = true;
    this.hoveredRoadNodes.clear();
    var items =
      this.roadNodeTree.select(
        this.fromClientRect(
          event.clientX - 6,
          event.clientY - 6,
          event.clientX + 6,
          event.clientY + 6));
    for (var i = 0; i < items.length; i++) {
      this.hoveredRoadNodes.insert(items[i].roadNode.vertexOffset);
    }
    var gl = this.painterContext.gl;
    this.hoveredRoadNodes.render(gl, gl.STREAM_DRAW);
  }
};

r.makeComponent("App", module);
