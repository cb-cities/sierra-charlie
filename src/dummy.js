"use strict";

var r = require("react-wrapper");
var http = require("./http");

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
      tileSize: r.propTypes.number.isRequired,
      toTileCoords: r.propTypes.func.isRequired,
      x: r.propTypes.number.isRequired,
      y: r.propTypes.number.isRequired
    };
  },

  getInitialState: function () {
    return {
      polylines: [],
      points: []
    };
  },

  componentDidMount: function () {
    var t = this.props.toTileCoords(this.props.x, this.props.y);
    var tileId = "tile-" + t.x + "-" + t.y;
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
    var s = this.props.tileSize;
    var t = this.props.toTileCoords(this.props.x, this.props.y);
    var dx = s * t.x;
    var dy = s * t.y;
    function toWorldX(p) {
      return p.x - dx;
    }
    function toWorldY(p) {
      return s - (p.y - dy);
    }
    function toWorldCoords(p) {
      return toWorldX(p) + "," + toWorldY(p);
    }
    return (
      r.svg({
          width: "100%",
          height: "100%"
        },
        r.rect({
            x: 0,
            y: 0,
            width: this.props.tileSize,
            height: this.props.tileSize,
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
          "(" + t.x + "," + t.y + ")"
        ),
        this.state.polylines.map(function (polyline, polylineIx) {
            return (
              r.polyline({
                  key: "l-" + polylineIx,
                  points: polyline.map(toWorldCoords).join(" "),
                  fill: "none",
                  stroke: "#999",
                  strokeWidth: 2
                }));
          }),
        this.state.points.map(function (point, pointIx) {
            return (
              r.circle({
                  key: "n-" + pointIx,
                  cx: toWorldX(point),
                  cy: toWorldY(point),
                  r: 2,
                  fill: "#fff",
                  stroke: "#999",
                  strokeWidth: 2
                }));
          })));
  }
};

r.makeComponent("Dummy", module);
