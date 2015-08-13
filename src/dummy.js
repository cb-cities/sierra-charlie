"use strict";

var r = require("./react");
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
    var tx = 489 + this.props.columnIx;
    var ty = 148 + this.props.rowIx;
    var polylinesId = "polylines-" + tx + "-" + ty;
    var storedPolylines = sessionStorage.getItem(polylinesId);
    if (storedPolylines) {
      var polylines = parseJson(storedPolylines) || [];
      this.setState({
          polylines: polylines
        });
    } else {
      http.sendRequest("GET", "/static/" + polylinesId + ".json", null, function (receivedPolylines, err) {
          if (receivedPolylines && !err) {
            var polylines = parseJson(receivedPolylines) || [];
            sessionStorage.setItem(polylinesId, receivedPolylines);
            if (this.isMounted()) {
              this.setState({
                  polylines: polylines
                });
            }
          }
        }.bind(this));
    }
    var pointsId = "points-" + tx + "-" + ty;
    var storedPoints = sessionStorage.getItem(pointsId);
    if (storedPoints) {
      var points = parseJson(storedPoints) || [];
      this.setState({
          points: points
        });
    } else {
      http.sendRequest("GET", "/static/" + pointsId + ".json", null, function (receivedPoints, err) {
          if (receivedPoints && !err) {
            var points = parseJson(receivedPoints) || [];
            sessionStorage.setItem(pointsId, receivedPoints);
            if (this.isMounted()) {
              this.setState({
                  points: points
                });
            }
          }
        }.bind(this));
    }
  },

  render: function () {
    var tx = 489 + this.props.columnIx;
    var ty = 148 + this.props.rowIx;
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
                        (point.x - dx) + "," + (point.y - dy));
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
                  cy: point.y - dy,
                  r: 2,
                  fill: "#fff",
                  stroke: "#999",
                  strokeWidth: 2
                }));
          })));
  }
};

r.makeComponent("Dummy", module);
