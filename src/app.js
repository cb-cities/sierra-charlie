"use strict";

var r = require("react-wrapper");
var defs = require("./defs");
var easeStateMixin = require("./ease-state-mixin");
var loaderMixin = require("./loader-mixin");
var painterMixin = require("./painter-mixin");
var rendererMixin = require("./renderer-mixin");
var iid = require("./image-id");
var tid = require("./tile-id");


module.exports = {
  mixins: [
    easeStateMixin,
    loaderMixin,
    painterMixin,
    rendererMixin
  ],

  getDefaultProps: function () {
    return {
      backgroundColor: "#000",
      inverseBackgroundColor: "#fff",
      roadLinkColor: "#f63",
      roadNodeColor: "#f93",
      borderColor: "#333",
      borderFont: '"HelveticaNeue-UltraLight", Helvetica, Arial, sans-serif'
    };
  },

  getInitialState: function () {
    return {
      attentionLeft: 0.4897637424698795,
      attentionTop: 0.4768826844262295,
      zoomPower: 3
    };
  },

  isTileVisible: function (tileId) {
    var lx = tid.getLocalX(tileId);
    var ly = tid.getLocalY(tileId);
    var isVisible = (
      lx >= this.firstVisibleLocalX &&
      lx <= this.lastVisibleLocalX &&
      ly >= this.firstVisibleLocalY &&
      ly <= this.lastVisibleLocalY);
    return isVisible;
  },

  isImageVisible: function (imageId) {
    var zoomPower = iid.getZoomPower(imageId);
    var easedZoomPower = this.getEasedZoomPower();
    var isInZoom = (
      zoomPower === Math.floor(easedZoomPower) ||
      zoomPower === Math.ceil(easedZoomPower));
    return (
      isInZoom &&
      this.isTileVisible(iid.toTileId(imageId)));
  },

  getEasedAttentionLeft: function () {
    return this.getEasedState("attentionLeft");
  },

  getEasedAttentionTop: function () {
    return this.getEasedState("attentionTop");
  },

  getEasedZoomPower: function () {
    return this.getEasedState("zoomPower");
  },

  getEasedZoomLevel: function () {
    return Math.pow(2, this.getEasedZoomPower());
  },

  easeAttentionLeft: function (attentionLeft, duration) {
    this.pendingScrollX = true;
    this.easeState("attentionLeft", attentionLeft, duration, function () {
        this.pendingScrollX = false;
      }.bind(this));
  },

  easeAttentionTop: function (attentionTop, duration) {
    this.pendingScrollY = true;
    this.easeState("attentionTop", attentionTop, duration, function () {
        this.pendingScrollY = false;
      }.bind(this));
  },

  easeZoomPower: function (zoomPower, duration) {
    this.pendingZoom = true;
    this.easeState("zoomPower", zoomPower, duration, function () {
        this.pendingZoom = false;
      }.bind(this));
  },


  componentDidMount: function () {
    this.node = r.domNode(this);
    this.canvas = this.node.firstChild;
    this.node.addEventListener("scroll", this.onScroll);
    addEventListener("resize", this.onResize);
    addEventListener("keydown", this.onKeyDown);
    this.importClientSize();
    this.exportBackgroundColor();
    this.exportScrollPosition();
    this.computeVisibleTiles();
    this.processVisibleTiles();
    this.paint();
  },

  componentWillUnmount: function () {
    this.node.removeEventListener("scroll", this.onScroll);
    removeEventListener("resize", this.onResize);
    removeEventListener("keydown", this.onKeyDown);
  },

  componentDidUpdate: function (prevProps, prevState) {
    this.exportBackgroundColor(prevState);
    this.exportScrollPosition();
    this.computeVisibleTiles();
    this.processVisibleTiles();
    this.paint();
  },

  onScroll: function (event) {
    if (!this.pendingScrollX && !this.pendingScrollY && !this.pendingZoom) {
      this.importScrollPosition();
    }
  },

  onResize: function (event) {
    this.importClientSize();
  },

  exportBackgroundColor: function (prevState) {
    if (!prevState || prevState.invertColor !== this.state.invertColor) {
      document.body.style.backgroundColor = (
        !this.state.invertColor ?
          this.props.backgroundColor :
          this.props.inverseBackgroundColor);
    }
  },

  exportScrollPosition: function () {
    var easedImageSize = defs.imageSize / this.getEasedZoomLevel();
    var scrollLeft = this.getEasedAttentionLeft() * defs.tileXCount * easedImageSize;
    var scrollTop  = this.getEasedAttentionTop() * defs.tileYCount * easedImageSize;
    if (scrollLeft !== this.node.scrollLeft) {
      this.node.scrollLeft = scrollLeft;
    }
    if (scrollTop !== this.node.scrollTop) {
      this.node.scrollTop = scrollTop;
    }
  },

  importScrollPosition: function () {
    var easedImageSize = defs.imageSize / this.getEasedZoomLevel();
    this.setState({
        attentionLeft: this.node.scrollLeft / (defs.tileXCount * easedImageSize),
        attentionTop:  this.node.scrollTop / (defs.tileYCount * easedImageSize)
      });
  },

  importClientSize: function () {
    this.setState({
        clientWidth:  this.node.clientWidth,
        clientHeight: this.node.clientHeight
      });
  },

  computeVisibleTiles: function () {
    var easedImageSize = defs.imageSize / this.getEasedZoomLevel();
    var scrollLeft = this.getEasedAttentionLeft() * defs.tileXCount * easedImageSize - this.state.clientWidth / 2;
    var scrollTop  = this.getEasedAttentionTop() * defs.tileYCount * easedImageSize - this.state.clientHeight / 2;
    this.firstVisibleLocalX = defs.clampLocalX(Math.floor(scrollLeft / easedImageSize));
    this.lastVisibleLocalX  = defs.clampLocalX(Math.floor((scrollLeft + this.state.clientWidth - 1) / easedImageSize));
    this.firstVisibleLocalY = defs.clampLocalY(Math.floor(scrollTop / easedImageSize));
    this.lastVisibleLocalY  = defs.clampLocalY(Math.floor((scrollTop + this.state.clientHeight - 1) / easedImageSize));
  },


  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    var easedImageSize = defs.imageSize / this.getEasedZoomLevel();
    var pageWidth  = 1 / (defs.tileXCount * easedImageSize / this.state.clientWidth);
    var pageHeight = 1 / (defs.tileYCount * easedImageSize / this.state.clientHeight);
    var delay = event.shiftKey ? 2500 : 500;
    switch (event.keyCode) {
      case 37: // left
      case 36: // home
        var left = this.state.attentionLeft - pageWidth / (event.keyCode === 36 ? 1 : 10);
        this.easeAttentionLeft(Math.max(0, left), delay);
        break;
      case 39: // right
      case 35: // end
        var left = this.state.attentionLeft + pageWidth / (event.keyCode === 35 ? 1 : 10);
        this.easeAttentionLeft(Math.min(left, 1), delay);
        break;
      case 38: // up
      case 33: // page up
        var top = this.state.attentionTop - pageHeight / (event.keyCode === 33 ? 1 : 10);
        this.easeAttentionTop(Math.max(0, top), delay);
        break;
      case 40: // down
      case 34: // page down
        var top = this.state.attentionTop + pageHeight / (event.keyCode === 34 ? 1 : 10);
        this.easeAttentionTop(Math.min(top, 1), delay);
        break;
      case 187: // minus
        var zoomPower = (Math.round(this.state.zoomPower * 10) - 2) / 10;
        this.easeZoomPower(Math.max(0, zoomPower), delay);
        break;
      case 189: // plus
        var zoomPower = (Math.round(this.state.zoomPower * 10) + 2) / 10;
        this.easeZoomPower(Math.min(zoomPower, defs.maxZoomPower), delay);
        break;
      case 67: // c
        this.setState({
            invertColor: !this.state.invertColor
          });
        break;
      default:
        if (event.keyCode >= 49 && event.keyCode <= 58) {
          this.easeZoomPower(event.keyCode - 49, delay);
        }
    }
  },

  onClick: function (event) {
    // console.log("click", event.clientX, event.clientY);
  },

  render: function () {
    var easedImageSize = defs.imageSize / this.getEasedZoomLevel();
    return (
      r.div("map-frame",
        r.canvas("map-picture"),
        r.div({
            className: "map-space",
            style: {
              width:  defs.tileXCount * easedImageSize,
              height: defs.tileYCount * easedImageSize
            },
            onClick: this.onClick
          })));
  }
};

r.makeComponent("App", module);
