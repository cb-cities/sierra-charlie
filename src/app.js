"use strict";

var r = require("react-wrapper");
var MISSING_TILE_IDS = require("./missing-tile-ids");
var TileId = require("./tile-id");
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
      tileSize:  1000,
      imageSize: 1024,
      firstTileX: 490,
      lastTileX:  572,
      firstTileY: 148,
      lastTileY:  208,
      missingTileIds: MISSING_TILE_IDS,
      maxZoomPower: 8,
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

  getTileXCount: function () {
    return this.props.lastTileX - this.props.firstTileX + 1;
  },

  getTileYCount: function () {
    return this.props.lastTileY - this.props.firstTileY + 1;
  },

  getTileId: function (tx, ty) {
    var tileId = new TileId(tx, ty);
    if (tileId in this.props.missingTileIds) {
      return null;
    }
    return tileId;
  },

  getValidTileId: function (tx, ty) {
    var isValid = (
      tx >= this.props.firstTileX &&
      tx <= this.props.lastTileX &&
      ty >= this.props.firstTileY &&
      ty <= this.props.lastTileY);
    return (
      !isValid ? null :
        this.getTileId(tx, ty));
  },

  isTileVisible: function (tx, ty) {
    var isVisible = (
      tx >= this.firstVisibleTileX &&
      tx <= this.lastVisibleTileX &&
      ty >= this.firstVisibleTileY &&
      ty <= this.lastVisibleTileY);
    return isVisible;
  },

  getVisibleTileId: function (tx, ty) {
    return (
      !this.isTileVisible(tx, ty) ? null :
        this.getTileId(tx, ty));
  },

  isImageVisible: function (tx, ty, tz) {
    var zoomPower = this.getEasedZoomPower();
    var isInZoom = (
      tz === Math.floor(zoomPower) ||
      tz === Math.ceil(zoomPower));
    return (
      isInZoom &&
      this.isTileVisible(tx, ty));
  },

  tileToLocalX: function (tx) {
    return tx - this.props.firstTileX;
  },

  tileToLocalY: function (ty) {
    return this.props.lastTileX - ty;
  },

  localToTileX: function (lx) {
    return this.props.firstTileX + lx;
  },

  localToTileY: function(ly) {
    return this.props.lastTileY - ly;
  },

  clampLocalX: function (lx) {
    return (
      Math.max(0,
        Math.min(lx, this.getTileXCount() - 1)));
  },

  clampLocalY: function (ly) {
    return (
      Math.max(0,
        Math.min(ly, this.getTileYCount() - 1)));
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
    this.loadVisibleTiles();
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
    this.loadVisibleTiles();
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
    var imageSize  = this.props.imageSize / this.getEasedZoomLevel();
    var scrollLeft = this.getEasedAttentionLeft() * (this.getTileXCount() * imageSize);
    var scrollTop  = this.getEasedAttentionTop() * (this.getTileYCount() * imageSize);
    if (scrollLeft !== this.node.scrollLeft) {
      this.node.scrollLeft = scrollLeft;
    }
    if (scrollTop !== this.node.scrollTop) {
      this.node.scrollTop = scrollTop;
    }
  },

  importScrollPosition: function () {
    var imageSize = this.props.imageSize / this.getEasedZoomLevel();
    this.setState({
        attentionLeft: this.node.scrollLeft / (this.getTileXCount() * imageSize),
        attentionTop:  this.node.scrollTop / (this.getTileYCount() * imageSize)
      });
  },

  importClientSize: function () {
    this.setState({
        clientWidth:  this.node.clientWidth,
        clientHeight: this.node.clientHeight
      });
  },

  computeVisibleTiles: function () {
    var imageSize = this.props.imageSize / this.getEasedZoomLevel();
    var scrollLeft = this.getEasedAttentionLeft() * this.getTileXCount() * imageSize - this.state.clientWidth / 2;
    var scrollTop  = this.getEasedAttentionTop() * this.getTileYCount() * imageSize - this.state.clientHeight / 2;
    this.firstVisibleLocalX = this.clampLocalX(Math.floor(scrollLeft / imageSize));
    this.lastVisibleLocalX  = this.clampLocalX(Math.floor((scrollLeft + this.state.clientWidth - 1) / imageSize));
    this.firstVisibleLocalY = this.clampLocalY(Math.floor(scrollTop / imageSize));
    this.lastVisibleLocalY  = this.clampLocalY(Math.floor((scrollTop + this.state.clientHeight - 1) / imageSize));
    this.firstVisibleTileX = this.localToTileX(this.firstVisibleLocalX);
    this.lastVisibleTileX  = this.localToTileX(this.lastVisibleLocalX);
    this.firstVisibleTileY = this.localToTileY(this.lastVisibleLocalY);
    this.lastVisibleTileY  = this.localToTileY(this.firstVisibleLocalY);
  },


  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    var imageSize = this.props.imageSize / this.getEasedZoomLevel();
    var pageWidth  = 1 / (this.getTileXCount() / (this.state.clientWidth / imageSize));
    var pageHeight = 1 / (this.getTileYCount() / (this.state.clientHeight / imageSize));
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
        this.easeZoomPower(Math.min((Math.round(this.state.zoomPower * 10) + 2) / 10, this.props.maxZoomPower), 500);
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
    var imageSize = this.props.imageSize / this.getEasedZoomLevel();
    return (
      r.div("map-frame",
        r.canvas("map-picture"),
        r.div({
            className: "map-space",
            style: {
              width:  this.getTileXCount() * imageSize,
              height: this.getTileYCount() * imageSize
            },
            onClick: this.onClick
          })));
  }
};

r.makeComponent("App", module);
