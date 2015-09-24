"use strict";

var r = require("react-wrapper");
var easeTween = require("ease-tween");
var tweenState = require("react-tween-state");
var loaderMixin = require("./loader-mixin");
var rendererMixin = require("./renderer-mixin");
var ImageId = require("./image-id");


var IMAGE_SIZE   = 1024;
var FIRST_TILE_X = 490;
var LAST_TILE_X  = 572;
var FIRST_TILE_Y = 148;
var LAST_TILE_Y  = 208;
var TILE_X_COUNT = LAST_TILE_X - FIRST_TILE_X + 1;
var TILE_Y_COUNT = LAST_TILE_Y - FIRST_TILE_Y + 1;

var MAX_ZOOM_POWER = 8;


// function tileToLocalX(tx) {
//   return tx - FIRST_TILE_X;
// }
//
// function tileToLocalY(ty) {
//   return LAST_TILE_Y - ty;
// }

function localToTileX(lx) {
  return FIRST_TILE_X + lx;
}

function localToTileY(ly) {
  return LAST_TILE_Y - ly;
}

function computeZoomLevel(zoomPower) {
  return Math.pow(2, zoomPower);
}

function clampLocalX(lx) {
  return Math.max(0, Math.min(lx, TILE_X_COUNT - 1));
}

function clampLocalY(ly) {
  return Math.max(0, Math.min(ly, TILE_Y_COUNT - 1));
}


module.exports = {
  mixins: [tweenState.Mixin, loaderMixin, rendererMixin],

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
      backgroundColor: "#000",
      inverseBackgroundColor: "#fff",
      roadLinkColor: "#f63",
      roadNodeColor: "#f93",
      borderColor: "#333",
      borderFont: '"HelveticaNeue-UltraLight", Helvetica, Arial, sans-serif'
    };
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
    // this.queueAllTiles();
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
    var imageSize = IMAGE_SIZE / this.getZoomLevel();
    this.node.scrollLeft = this.attentionLeft * TILE_X_COUNT * imageSize;
    this.node.scrollTop  = this.attentionTop * TILE_Y_COUNT * imageSize;
  },

  importScrollPosition: function () {
    var imageSize = IMAGE_SIZE / this.getZoomLevel();
    this.attentionLeft = this.node.scrollLeft / (TILE_X_COUNT * imageSize);
    this.attentionTop  = this.node.scrollTop / (TILE_Y_COUNT * imageSize);
  },

  computeVisibleTiles: function () {
    var imageSize = IMAGE_SIZE / this.getZoomLevel();
    var scrollLeft = this.attentionLeft * TILE_X_COUNT * imageSize - this.clientWidth / 2;
    var scrollTop  = this.attentionTop * TILE_Y_COUNT * imageSize - this.clientHeight / 2;
    this.fvlx = clampLocalX(Math.floor(scrollLeft / imageSize));
    this.lvlx = clampLocalX(Math.floor((scrollLeft + this.clientWidth - 1) / imageSize));
    this.fvly = clampLocalY(Math.floor(scrollTop / imageSize));
    this.lvly = clampLocalY(Math.floor((scrollTop + this.clientHeight - 1) / imageSize));
    this.fvtx = localToTileX(this.fvlx);
    this.lvtx = localToTileX(this.lvlx);
    this.fvty = localToTileY(this.lvly);
    this.lvty = localToTileY(this.fvly);
  },

  isTileIdVisible: function (tileId) {
    return this.isTileVisible(tileId.tx, tileId.ty);
  },

  isTileVisible: function (tx, ty) {
    return (
      tx >= this.fvtx && tx <= this.lvtx &&
      ty >= this.fvty && ty <= this.lvty);
  },

  isImageIdVisible: function (imageId) {
    return this.isImageVisible(imageId.tx, imageId.ty, imageId.tz);
  },

  isImageVisible: function (tx, ty, tz) {
    var zoomPower = this.getZoomPower();
    return (
      this.isTileVisible(tx, ty) && (
        tz === Math.floor(zoomPower) ||
        tz === Math.ceil(zoomPower)));
  },


  paint: function () {
    if (!this.pendingPaint) {
      this.pendingPaint = true;
      this.storedZoomPower = this.getZoomPower();
      window.requestAnimationFrame(this.paintNow);
    }
  },

  paintNow: function () {
    var width  = window.devicePixelRatio * this.clientWidth;
    var height = window.devicePixelRatio * this.clientHeight;
    var canvas = this.canvas;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width  = width;
      canvas.height = height;
    }
    var c = canvas.getContext("2d", {alpha: false});
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.scale(window.devicePixelRatio, window.devicePixelRatio);
    c.save();
    c.fillStyle = this.props.backgroundColor;
    c.fillRect(0, 0, this.clientWidth, this.clientHeight);
    this.paintTileBorders(c);
    c.restore();
    c.save();
    this.paintTileContents(c);
    c.restore();
    if (this.state.invertColor) {
      c.globalCompositeOperation = "difference";
      c.fillStyle = "#fff";
      c.fillRect(0, 0, this.clientWidth, this.clientHeight);
      c.globalCompositeOperation = "source-over";
    }
    this.pendingPaint = false;
  },

  paintTileBorders: function (c) {
    var zoomPower  = this.storedZoomPower;
    var zoomLevel  = computeZoomLevel(zoomPower);
    var imageSize  = IMAGE_SIZE / zoomLevel;
    var scrollLeft = this.attentionLeft * TILE_X_COUNT * imageSize - this.clientWidth / 2;
    var scrollTop  = this.attentionTop * TILE_Y_COUNT * imageSize - this.clientHeight / 2;
    c.translate(-scrollLeft + 0.25, -scrollTop + 0.25);
    c.scale(1 / zoomLevel, 1 / zoomLevel);
    c.lineWidth = 0.5 * zoomLevel;
    c.fillStyle = c.strokeStyle = this.props.borderColor;
    c.font = 24 * Math.sqrt(zoomLevel) + "px " + this.props.borderFont;
    c.textAlign = "left";
    c.textBaseline = "top";
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
        var tx = localToTileX(lx);
        var ty = localToTileY(ly);
        if (zoomPower < 3) {
          c.globalAlpha = 1 - (zoomPower - 2);
          c.fillText(tx + "×" + ty, lx * IMAGE_SIZE + 4 * Math.sqrt(zoomLevel), ly * IMAGE_SIZE);
          c.globalAlpha = 1;
        }
        c.strokeRect(lx * IMAGE_SIZE, ly * IMAGE_SIZE, IMAGE_SIZE, IMAGE_SIZE);
      }
    }
  },

  getApproximateImage: function (lx, ly, zoomPower) {
    var tx = localToTileX(lx);
    var ty = localToTileY(ly);
    for (var tz = Math.round(zoomPower); tz >= 0; tz--) {
      var imageId = new ImageId(tx, ty, tz);
      var imageData = this.getImage(imageId);
      if (imageData) {
        return imageData;
      }
    }
    for (var tz = Math.round(zoomPower); tz <= MAX_ZOOM_POWER; tz++) {
      var imageId = new ImageId(tx, ty, tz);
      var imageData = this.getImage(imageId);
      if (imageData) {
        return imageData;
      }
    }
    return null;
  },

  paintTileContents: function (c) {
    var zoomPower  = this.storedZoomPower;
    var zoomLevel  = computeZoomLevel(zoomPower);
    var imageSize  = IMAGE_SIZE / zoomLevel;
    var scrollLeft = this.attentionLeft * TILE_X_COUNT * imageSize - this.clientWidth / 2;
    var scrollTop  = this.attentionTop * TILE_Y_COUNT * imageSize - this.clientHeight / 2;
    c.translate(-scrollLeft, -scrollTop);
    c.scale(1 / zoomLevel, -1 / zoomLevel);
    c.translate(0, -TILE_Y_COUNT * IMAGE_SIZE);
    for (var lx = this.fvlx; lx <= this.lvlx; lx++) {
      for (var ly = this.fvly; ly <= this.lvly; ly++) {
        var imageData = this.getApproximateImage(lx, ly, zoomPower);
        if (imageData) {
          c.drawImage(imageData, lx * IMAGE_SIZE, (TILE_Y_COUNT - ly - 1) * IMAGE_SIZE, IMAGE_SIZE, IMAGE_SIZE);
        }
      }
    }
  },


  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    if (event.keyCode >= 49 && event.keyCode <= 58) {
      this.tweenZoomPower(event.keyCode - 49, 500);
    } else if (event.keyCode === 187) {
      this.tweenZoomPower(Math.max(0, (Math.round(this.state.zoomPower * 10) - 2) / 10), 500);
    } else if (event.keyCode === 189) {
      this.tweenZoomPower(Math.min((Math.round(this.state.zoomPower * 10) + 2) / 10, MAX_ZOOM_POWER), 500);
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
    var imageSize = IMAGE_SIZE / this.getZoomLevel();
    return (
      r.div("map-frame",
        r.canvas("map-picture"),
        r.div({
            className: "map-space",
            style: {
              width:  TILE_X_COUNT * imageSize,
              height: TILE_Y_COUNT * imageSize
            },
            onClick: this.onClick
          })));
  }
};

r.makeComponent("App", module);
