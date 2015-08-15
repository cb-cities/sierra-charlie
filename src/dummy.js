"use strict";

var r = require("react-wrapper");
var http = require("./http");

var TX_START = 488;
// var TX_END   = 574;
// var TY_START = 146;
var TY_END   = 211;

function parseJson(json) {
  var result;
  try {
    result = JSON.parse(json);
  } catch (ex) {
    console.error(ex);
  }
  return result;
}

module.exports = {
  propTypes: function () {
    return {
      columnIx: r.propTypes.number.isRequired,
      rowIx: r.propTypes.number.isRequired
    };
  },

  getInitialState: function () {
    return {
      polylines: [],
      points: []
    };
  },

  componentDidMount: function () {
    var tx = TX_START + this.props.columnIx;
    var ty = TY_END - this.props.rowIx;
    var tileId = "tile-" + tx + "-" + ty;
    http.sendRequest("GET", "/json/" + tileId + ".json.gz", null, function (receivedTile, err) {
        if (this.isMounted() && receivedTile && !err) {
          var tile = parseJson(receivedTile) || {};
          this.setState({
              polylines: tile.polylines || [],
              points:    tile.points || []
            });
        }
      }.bind(this));
  },

  render: function () {
    var tx = TX_START + this.props.columnIx;
    var ty = TY_END - this.props.rowIx;
    var dx = tx * 1000;
    var dy = ty * 1000;
    return (
      r.svg({
          width: "100%",
          height: "100%",
        },
        r.rect({
            x: 0,
            y: 0,
            width: 1000,
            height: 1000,
            fill: "none",
            stroke: "#ccc",
            strokeWidth: 1
          }),
        r.text({
            x: 5,
            y: 15,
            fontSize: 12,
            fill: "#f0690f"
          },
          "(" + tx + "," + ty + ")"
        ),
        this.state.polylines.map(function (polyline, polylineIx) {
            return (
              r.polyline({
                  key: "l-" + polylineIx,
                  points: polyline.map(function (point) {
                      return (
                        (point.x - dx) + "," + (1000 - (point.y - dy)));
                    }).join(" "),
                  fill: "none",
                  stroke: "#999",
                  strokeWidth: 2
                }));
          }),
        this.state.points.map(function (point, pointIx) {
            return (
              r.circle({
                  key: "n-" + pointIx,
                  cx: point.x - dx,
                  cy: 1000 - (point.y - dy),
                  r: 2,
                  fill: "#fff",
                  stroke: "#999",
                  strokeWidth: 2
                }));
          })));
  }
};

r.makeComponent("Dummy", module);
