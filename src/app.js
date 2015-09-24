"use strict";

var r = require("react-wrapper");
var easeTween = require("ease-tween");
var tweenState = require("react-tween-state");
var MISSING_TILE_IDS = require("./missing-tile-ids");
var TileId = require("./tile-id");
var loaderMixin = require("./loader-mixin");
var painterMixin = require("./painter-mixin");
var rendererMixin = require("./renderer-mixin");


module.exports = {
  mixins: [tweenState.Mixin, loaderMixin, rendererMixin, painterMixin],

  easeTweenState: function (name, value, duration, cb) {
    if (!this.easeCounters) {
      this.easeCounters = {};
    }
    if (!this.easeCounters[name]) {
      this.easeCounters[name] = 1;
    } else {
      this.easeCounters[name]++;
    }
    this.tweenState(name, {
        endValue: value,
        duration: duration,
        easing: function (elapsed, from, to) {
          return from + (to - from) * easeTween.ease(elapsed / duration);
        },
        onEnd: function () {
          if (!--this.easeCounters[name]) {
            cb();
          }
        }.bind(this)
      });
  },


  getInitialState: function () {
    return {
      zoomPower: 3
    };
  },

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
      tx >= this.props.firstTileX && tx <= this.props.lastTileX &&
      ty >= this.props.firstTileY && ty <= this.props.lastTileY);
    return (
      !isValid ? null :
        this.getTileId(tx, ty));
  },

  isTileVisible: function (tx, ty) {
    var isVisible = (
      tx >= this.fvtx && tx <= this.lvtx &&
      ty >= this.fvty && ty <= this.lvty);
    return isVisible;
  },

  getVisibleTileId: function (tx, ty) {
    return (
      !this.isTileVisible(tx, ty) ? null :
        this.getTileId(tx, ty));
  },

  isImageVisible: function (tx, ty, tz) {
    var zoomPower = this.getZoomPower();
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
    return Math.max(0, Math.min(lx, this.getTileXCount() - 1));
  },

  clampLocalY: function (ly) {
    return Math.max(0, Math.min(ly, this.getTileYCount() - 1));
  },

  getZoomPower: function () {
    return this.getTweeningValue("zoomPower");
  },

  getZoomLevel: function () {
    return Math.pow(2, this.getZoomPower());
  },

  tweenZoomPower: function (zoomPower, duration) {
    this.pendingZoom = true;
    this.easeTweenState("zoomPower", zoomPower, duration, function () {
        this.pendingZoom = false;
      }.bind(this));
  },


  componentDidMount: function () {
    this.node = r.domNode(this);
    this.canvas = this.node.firstChild;
    this.clientWidth  = this.node.clientWidth;
    this.clientHeight = this.node.clientHeight;
    this.attentionLeft = 0.4897637424698795;
    this.attentionTop  = 0.4768826844262295;
    this.node.addEventListener("scroll", this.onScroll);
    addEventListener("resize", this.onResize);
    addEventListener("keydown", this.onKeyDown);
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
    if (!this.pendingZoom) {
      this.importScrollPosition();
      this.computeVisibleTiles();
      this.loadVisibleTiles();
      this.paint();
    }
  },

  onResize: function (event) {
    this.clientWidth  = this.node.clientWidth;
    this.clientHeight = this.node.clientHeight;
    this.computeVisibleTiles();
    this.loadVisibleTiles();
    this.paint();
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
    var imageSize  = this.props.imageSize / this.getZoomLevel();
    var scrollLeft = this.attentionLeft * (this.getTileXCount() * imageSize);
    var scrollTop  = this.attentionTop  * (this.getTileYCount() * imageSize);
    if (scrollLeft !== this.node.scrollLeft) {
      this.node.scrollLeft = scrollLeft;
    }
    if (scrollTop !== this.node.scrollTop) {
      this.node.scrollTop = scrollTop;
    }
  },

  importScrollPosition: function () {
    var imageSize = this.props.imageSize / this.getZoomLevel();
    this.attentionLeft = this.node.scrollLeft / (this.getTileXCount() * imageSize);
    this.attentionTop  = this.node.scrollTop / (this.getTileYCount() * imageSize);
  },

  computeVisibleTiles: function () {
    var imageSize = this.props.imageSize / this.getZoomLevel();
    var scrollLeft = this.attentionLeft * this.getTileXCount() * imageSize - this.clientWidth / 2;
    var scrollTop  = this.attentionTop * this.getTileYCount() * imageSize - this.clientHeight / 2;
    this.fvlx = this.clampLocalX(Math.floor(scrollLeft / imageSize));
    this.lvlx = this.clampLocalX(Math.floor((scrollLeft + this.clientWidth - 1) / imageSize));
    this.fvly = this.clampLocalY(Math.floor(scrollTop / imageSize));
    this.lvly = this.clampLocalY(Math.floor((scrollTop + this.clientHeight - 1) / imageSize));
    this.fvtx = this.localToTileX(this.fvlx);
    this.lvtx = this.localToTileX(this.lvlx);
    this.fvty = this.localToTileY(this.lvly);
    this.lvty = this.localToTileY(this.fvly);
  },


  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    if (event.keyCode >= 49 && event.keyCode <= 58) {
      this.tweenZoomPower(event.keyCode - 49, 500);
    } else if (event.keyCode === 187) {
      this.tweenZoomPower(Math.max(0, (Math.round(this.state.zoomPower * 10) - 2) / 10), 500);
    } else if (event.keyCode === 189) {
      this.tweenZoomPower(Math.min((Math.round(this.state.zoomPower * 10) + 2) / 10, this.props.maxZoomPower), 500);
    } else if (event.keyCode === 67) {
      this.setState({
          invertColor: !this.state.invertColor
        });
    }
  },

  onClick: function (event) {
    // console.log("click", event.clientX, event.clientY);
  },

  render: function () {
    var imageSize = this.props.imageSize / this.getZoomLevel();
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
