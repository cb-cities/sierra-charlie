"use strict";

var r = require("react-wrapper");
var lazyScroller = r.wrap(require("lazy-scroller"));
var dummy = r.wrap(require("./dummy"));

var TILE_SIZE = 1000;
var FIRST_TILE_COLUMN = 488;
var LAST_TILE_COLUMN = 574;
var TILE_COLUMN_COUNT = LAST_TILE_COLUMN - FIRST_TILE_COLUMN + 1;
var FIRST_TILE_ROW = 146;
var LAST_TILE_ROW = 211;
var TILE_ROW_COUNT = LAST_TILE_ROW - FIRST_TILE_ROW + 1;

var DEFAULT_TILE_COORDS = {
  x: 530,
  y: 180
};

function toTileCoords(x, y) {
  return {
    x: FIRST_TILE_COLUMN + x,
    y: LAST_TILE_ROW - y
  };
}

function fromTileCoords(t) {
  return {
    x: t.x - FIRST_TILE_COLUMN,
    y: LAST_TILE_ROW - t.y
  };
}

function encodeTileCoords(t) {
  return "#" + t.x + "," + t.y;
}

function decodeTileCoords(hash) {
  if (!hash || hash[0] !== "#") {
    return undefined;
  }
  var tokens = hash.slice(1).split(",");
  if (tokens.length !== 2) {
    return undefined;
  }
  return (
    acceptTileCoords({
        x: parseInt(tokens[0]),
        y: parseInt(tokens[1])
      }));
}

function restoreTileCoords(state) {
  return (
    !state ? undefined :
      acceptTileCoords(state.tileCoords));
}

function acceptTileCoords(t) {
  var isValid = (
    t &&
    t.x >= FIRST_TILE_COLUMN &&
    t.x <= LAST_TILE_COLUMN &&
    t.y >= FIRST_TILE_ROW &&
    t.y <= LAST_TILE_ROW);
  return (
    !isValid ? undefined :
      t);
}

module.exports = {
  getInitialState: function () {
    var hash = location.hash;
    var t = decodeTileCoords(location.hash);
    if (!t) {
      t = DEFAULT_TILE_COORDS;
      hash = encodeTileCoords(t);
    //   console.log("getInitialState: replaced history state based on default", t.x, t.y);
    // } else {
    //   console.log("getInitialState: replaced history state based on location", t.x, t.y);
    }
    history.replaceState({
        tileCoords: t
      }, "", hash);
    return {
      targetTileX: t.x,
      targetTileY: t.y,
      isUpdated: false
    };
  },

  componentDidMount: function () {
    addEventListener("popstate", this.onPopState);
  },

  componentWillUnmount: function () {
    removeEventListener("popstate", this.onPopState);
  },

  onPopState: function (event) {
    var t = restoreTileCoords(event.state);
    if (t) {
      this.publishTarget(t);
      // console.log("onPopState: published target based on history state", t.x, t.y);
    } else {
      t = decodeTileCoords(location.hash);
      if (t) {
        this.publishTarget(t);
      //   console.log("onPopState: published target based on location", t.x, t.y);
      // } else {
      //   console.log("onPopState: did not publish target");
      }
    }
  },

  getTarget: function () {
    return fromTileCoords({
        x: this.state.targetTileX,
        y: this.state.targetTileY
      });
  },

  subscribeToTarget: function (subscriber) {
    if (this.isMounted()) {
      this.setState({
          subscriber: subscriber
        });
    }
  },

  unsubscribeFromTarget: function () {
    if (this.isMounted()) {
      this.setState({
          subscriber: null
        });
    }
  },

  publishTarget: function (t) {
    if (this.isMounted()) {
      this.setState({
          targetTileX: t.x,
          targetTileY: t.y,
          isUpdated: false
        }, function () {
          if (this.state.subscriber) {
            this.state.subscriber(fromTileCoords(t));
          }
        }.bind(this));
    }
  },

  onUpdate: function (event) {
    var t = toTileCoords(event.x, event.y);
    var isUpdated = (
      t.x !== this.state.targetTileX ||
      t.y !== this.state.targetTileY);
    if (isUpdated) {
      var hash = encodeTileCoords(t);
      if (!this.state.isUpdated) {
        history.pushState({
            tileCoords: t
          }, "", hash);
        // console.log("onUpdate: added history state based on update", t.x, t.y);
      } else {
        history.replaceState({
            tileCoords: t
          }, "", hash);
        // console.log("onUpdate: replaced history state based on update", t.x, t.y);
      }
      this.setState({
          targetTileX: t.x,
          targetTileY: t.y,
          isUpdated: true
        });
    }
  },

  render: function () {
    return (
      lazyScroller({
          columnCount: TILE_COLUMN_COUNT,
          columnWidth: TILE_SIZE,
          rowCount: TILE_ROW_COUNT,
          rowHeight: TILE_SIZE,
          tileChild: dummy,
          tileChildProps: {
            tileSize: TILE_SIZE,
            toTileCoords: toTileCoords
          },
          getTarget: this.getTarget,
          subscribeToTarget: this.subscribeToTarget,
          unsubscribeFromTarget: this.unsubscribeFromTarget,
          onUpdate: this.onUpdate
        }));
  }
};

r.makeComponent("App", module);
