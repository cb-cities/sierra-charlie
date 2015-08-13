"use strict";

var r = require("./react");

module.exports = {
  propTypes: function () {
    return {
      columnCount: r.propTypes.number.isRequired,
      columnWidth: r.propTypes.number.isRequired,
      rowCount: r.propTypes.number.isRequired,
      rowHeight: r.propTypes.number.isRequired,
      metrics: r.propTypes.object.isRequired,
      cells: r.propTypes.array.isRequired
    };
  },

  render: function () {
    var metrics = this.props.metrics;
    var gridWidth;
    var gridHeight;
    if (this.props.columnWidth < this.props.rowHeight) {
      gridWidth = 5;
      gridHeight = Math.ceil(5 * this.props.rowHeight / this.props.columnWidth);
    } else {
      gridWidth = Math.ceil(5 * this.props.columnWidth / this.props.rowHeight);
      gridHeight = 5;
    }
    var borderThickness = 1;
    var cellWidth = gridWidth - borderThickness;
    var cellHeight = gridHeight - borderThickness;
    return (
      r.div({
          className: "scroller-map",
          style: {
            width: this.props.columnCount * gridWidth + borderThickness * 3 + "px",
            height: this.props.rowCount * gridHeight + borderThickness * 3 + "px",
            position: "absolute",
            left: "10px",
            bottom: "10px",
            border: borderThickness + "px #ccc solid",
            background: "#fff",
            opacity: 0.85,
            boxSizing: "border-box"
          }
        },
        this.props.cells.map(function (cell) {
            var isVisible = (
              cell.columnIx >= metrics.firstColumn &&
              cell.columnIx <= metrics.firstColumn + metrics.columnCount - 1 &&
              cell.rowIx >= metrics.firstRow &&
              cell.rowIx <= metrics.firstRow + metrics.rowCount - 1);
            return (
              r.div({
                  key: "smc-" + cell.columnIx + "-" + cell.rowIx,
                  className: "scroller-map-cell",
                  style: {
                    width: cellWidth,
                    height: cellHeight,
                    position: "absolute",
                    left: cell.columnIx * gridWidth + 2 + "px",
                    top: cell.rowIx * gridHeight + 2 + "px",
                    border: borderThickness + "px " + (isVisible ? "#999" : "#ccc") + " solid",
                    background: "#fff",
                    zIndex: isVisible ? 1 : 0
                  }
                }));
          }.bind(this))));
  }
};

r.makeComponent("ScrollerMap", module);
