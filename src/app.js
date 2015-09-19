"use strict";

var r = require("react-wrapper");
var mapViewer = r.wrap(require("lazy-map-viewer"));
var spaceInspector = r.wrap(require("./space-inspector"));
var timeInspector = r.wrap(require("./time-inspector"));

/*

Dynamics of bimodality in vehicular traffic flows
Arjun Mullick, Arnab K. Ray, 2014

*/

function N(t) {
  var A = 44.0;
  var MU = 8.53;
  var LAMBDA = 0.19;
  var BETA = -0.09;
  var x = LAMBDA * t - BETA;
  return A * (MU + t * t) * Math.exp(-(x * x));
}

var VALUES = [];
for (var i = 0; i < 24; i++) {
  VALUES[i] = N((i / 23) * 20 - 10) / 800;
}

module.exports = {
  getInitialState: function () {
    return {
      selectedTime: 9
    };
  },

  render: function () {
    return (
      r.div({
          style: {
            width: "100%",
            height: "100%",
            position: "relative"
          }
        },
        mapViewer({
            city: "London",
            tileSize: 1000,
            firstTileColumn: 488,
            lastTileColumn: 574,
            firstTileRow: 146,
            lastTileRow: 211,
            initialTileCoords: {
              x: 530,
              y: 180
            },
            selectedTOID: this.state.selectedTOID,
            onClick: function (target) {
              switch (target.type) {
                case "roadLink":
                  console.log("length: ", target.length);
                  this.setState({
                      selectedTOID: target.toid,
                      selectedLength: target.length
                    });
                  break;
                case "roadNode":
                  this.setState({
                      selectedTOID: target.toid,
                      selectedLength: null
                    });
                  break;
                case "tileFrame":
                  this.setState({
                      selectedTOID: null,
                      selectedLength: null
                    });
                  break;
                case "tileLabel":
                  // TODO
                  break;
                default:
                  console.warn("Unknown click target:", target);
              }
            }.bind(this)
          }),
        // spaceInspector({
        //     selectedTOID: this.state.selectedTOID,
        //     selectedLength: this.state.selectedLength
        //   }),
        timeInspector({
            selectedColumn: this.state.selectedTime,
            columnValues: VALUES,
            onClick: function (column) {
              this.setState({
                  selectedTime: column
                });
            }.bind(this)
          })));
  }
};

r.makeComponent("App", module);
