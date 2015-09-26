"use strict";

var r = require("react-wrapper");
var defs = require("./defs");
var easeStateMixin = require("./ease-state-mixin");
var loaderMixin = require("./loader-mixin");
var painterMixin = require("./painter-mixin");
var rendererMixin = require("./renderer-mixin");


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

  isTileVisible: function (lx, ly) {
    var isVisible = (
      lx >= this.firstVisibleLocalX &&
      lx <= this.lastVisibleLocalX &&
      ly >= this.firstVisibleLocalY &&
      ly <= this.lastVisibleLocalY);
    return isVisible;
  },

  isImageVisible: function (lx, ly, zoomPower) {
    var easedZoomPower = this.getEasedZoomPower();
    var floorZoomPower = Math.floor(easedZoomPower);
    var ceilZoomPower  = Math.ceil(easedZoomPower);
    var isInZoom = (
      zoomPower === floorZoomPower ||
      zoomPower === ceilZoomPower);
    return (
      isInZoom &&
      this.isTileVisible(lx, ly));
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
    var scrollLeft = this.getEasedAttentionLeft() * (defs.tileXCount * easedImageSize);
    var scrollTop  = this.getEasedAttentionTop() * (defs.tileYCount * easedImageSize);
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
    this.firstVisibleTileX = defs.localToTileX(this.firstVisibleLocalX);
    this.lastVisibleTileX  = defs.localToTileX(this.lastVisibleLocalX);
    this.firstVisibleTileY = defs.localToTileY(this.lastVisibleLocalY);
    this.lastVisibleTileY  = defs.localToTileY(this.firstVisibleLocalY);
  },


  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    var easedImageSize = defs.imageSize / this.getEasedZoomLevel();
    var pageWidth  = 1 / (defs.tileXCount * easedImageSize / this.state.clientWidth);
    var pageHeight = 1 / (defs.tileYCount * easedImageSize / this.state.clientHeight);
    switch (event.keyCode) {
      case 37: // left
        this.easeAttentionLeft(Math.max(0, this.state.attentionLeft - pageWidth / 10), 500);
        break;
      case 39: // right
        this.easeAttentionLeft(Math.min(this.state.attentionLeft + pageWidth / 10, 1), 500);
        break;
      case 38: // up
        this.easeAttentionTop(Math.max(0, this.state.attentionTop - pageHeight / 10), 500);
        break;
      case 40: // down
        this.easeAttentionTop(Math.min(this.state.attentionTop + pageHeight / 10, 1), 500);
        break;
      case 36: // home
        this.easeAttentionLeft(Math.max(0, this.state.attentionLeft - pageWidth), 500);
        break;
      case 35: // end
        this.easeAttentionLeft(Math.min(this.state.attentionLeft + pageWidth, 1), 500);
        break;
      case 33: // page up
        this.easeAttentionTop(Math.max(0, this.state.attentionTop - pageHeight), 500);
        break;
      case 34: // page down
        this.easeAttentionTop(Math.min(this.state.attentionTop + pageHeight, 1), 500);
        break;
      case 187: // minus
        this.easeZoomPower(Math.max(0, (Math.round(this.state.zoomPower * 10) - 2) / 10), 500);
        break;
      case 189: // plus
        this.easeZoomPower(Math.min((Math.round(this.state.zoomPower * 10) + 2) / 10, defs.maxZoomPower), 500);
        break;
      case 67: // c
        this.setState({
            invertColor: !this.state.invertColor
          });
        break;
      default:
        if (event.keyCode >= 49 && event.keyCode <= 58) {
          this.easeZoomPower(event.keyCode - 49, 500);
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
