"use strict";

var r = require("react-wrapper");
var easeTween = require("ease-tween");
var tweenState = require("react-tween-state");
var loaderMixin = require("./loader-mixin");
var rendererMixin = require("./renderer-mixin");
var painterMixin = require("./painter-mixin");


function computeZoomLevel(zoomPower) {
  return Math.pow(2, zoomPower);
}


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

  isTileValid: function (tx, ty) {
    return (
      tx >= this.props.firstTileX && tx <= this.props.lastTileX &&
      ty >= this.props.firstTileY && ty <= this.props.lastTileY);
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
    return computeZoomLevel(this.getZoomPower());
  },

  tweenZoomPower: function (zoomPower, duration) {
    this.pendingZoom = true;
    this.easeTweenState("zoomPower", zoomPower, duration, function () {
        this.pendingZoom = false;
      }.bind(this));
  },


  componentDidMount: function () {
    this.exportBackgroundColor();
    this.node = r.domNode(this);
    this.canvas = this.node.firstChild;
    this.clientWidth  = this.node.clientWidth;
    this.clientHeight = this.node.clientHeight;
    this.attentionLeft = 0.4897637424698795;
    this.attentionTop  = 0.4768826844262295;
    this.exportScrollPosition();
    this.node.addEventListener("scroll", this.onScroll);
    addEventListener("resize", this.onResize);
    addEventListener("keydown", this.onKeyDown);
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
    if (prevState.invertColor !== this.state.invertColor) {
      this.exportBackgroundColor();
    }
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

  exportBackgroundColor: function () {
    document.body.style.backgroundColor = (
      !this.state.invertColor ?
        this.props.backgroundColor :
        this.props.inverseBackgroundColor);
  },

  exportScrollPosition: function () {
    var imageSize = this.props.imageSize / this.getZoomLevel();
    this.node.scrollLeft = this.attentionLeft * this.getTileXCount() * imageSize;
    this.node.scrollTop  = this.attentionTop * this.getTileYCount() * imageSize;
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

  isTileVisible: function (tx, ty) {
    return (
      tx >= this.fvtx && tx <= this.lvtx &&
      ty >= this.fvty && ty <= this.lvty);
  },

  isImageVisible: function (tx, ty, tz) {
    var zoomPower = this.getZoomPower();
    return (
      this.isTileVisible(tx, ty) && (
        tz === Math.floor(zoomPower) ||
        tz === Math.ceil(zoomPower)));
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
