"use strict";

var r = require("react-wrapper");

require("./time-inspector.css");

function makeDefaultColumnLabel(x) {
  if (x === 0 || x === 24) {
    return "midnight";
  }
  if (x === 12) {
    return "noon";
  }
  if (x > 12) {
    return x - 12 + "pm";
  }
  return x + "am";
}

function makeDefaultRowLabel(y) {
  if (y === 10) {
    return "1.0";
  }
  return "0." + y;
}

module.exports = {
  propTypes: function () {
    return {
      selectedColumn: r.propTypes.string.isRequired,
      columnValues: r.propTypes.array.isRequired,
      makeColumnLabel: r.propTypes.func.isRequired,
      makeRowLabel: r.propTypes.func.isRequired,
      onClick: r.propTypes.func.isRequired,
    };
  },

  getDefaultProps: function () {
    return {
      columnCount: 24,
      columnWidth: 15,
      columnsPerLabel: 3,
      rowCount: 10,
      rowHeight: 30,
      marginSize: 15,
      makeColumnLabel: makeDefaultColumnLabel,
      makeRowLabel: makeDefaultRowLabel
    };
  },

  renderColumns: function () {
    var columns = [];
    for (var x = 0; x < this.props.columnCount; x++) {
      columns.push(this.renderColumn(x));
    }
    return r.div("time-inspector-columns", columns);
  },

  renderColumn: function (x) {
    var isSelected = x === this.props.selectedColumn;
    var v = this.props.columnValues[x];
    return (
      r.div({
          key: "cs-" + x,
          className: "time-inspector-column" + (isSelected ? " selected" : ""),
          style: {
            width: this.props.columnWidth - 1,
            height: this.props.rowCount * this.props.rowHeight - 1,
            left: x * this.props.columnWidth + 1,
            top: 1
          },
          onClick: function (event) {
            event.stopPropagation();
            this.props.onClick(x);
          }.bind(this)
        },
        r.div({
            className: "time-inspector-column-fill" + (isSelected ? " selected" : ""),
            style: {
              width: this.props.columnWidth,
              height: Math.ceil(this.props.rowCount * this.props.rowHeight * v) - 1,
              left: 0,
              bottom: 0
            }
          })));
  },

  renderRows: function () {
    var rows = [];
    for (var y = 0; y < this.props.rowCount; y++) {
      rows.push(this.renderRow(y));
    }
    return r.div("time-inspector-rows", rows);
  },

  renderRow: function (y) {
    return (
      r.div({
          key: "r-" + y,
          className: "time-inspector-row",
          style: {
            width: this.props.columnCount * this.props.columnWidth,
            height: this.props.rowHeight,
            left: 1,
            top: y * this.props.rowHeight + 1,
          }
        }));
  },

  renderColumnLabels: function () {
    var labels = [];
    for (var x = 1; x <= this.props.columnCount; x++) {
      if (x % this.props.columnsPerLabel === 0) {
        labels.push(this.renderColumnLabel(x));
      }
    }
    return (
      r.div({
          className: "time-inspector-column-labels",
          style: {
            width: this.props.columnCount * this.props.columnWidth,
            height: this.props.marginSize,
            left: 1,
            bottom: -this.props.marginSize
          }
        },
        labels));
  },

  renderColumnLabel: function (x) {
    return (
      r.div({
          key: "cl-" + x,
          className: "time-inspector-column-label",
          style: {
            width: this.props.columnWidth * 2,
            left: (x - 1) * this.props.columnWidth,
            top: 2
          }
        },
        this.props.makeColumnLabel(x)));
  },

  renderRowLabels: function () {
    var labels = [];
    for (var y = 0; y < this.props.rowCount; y++) {
      labels.push(this.renderRowLabel(y));
    }
    return (
      r.div({
          className: "time-inspector-row-labels",
          style: {
            width: this.props.marginSize,
            height: this.props.rowCount * this.props.rowHeight,
            left: -this.props.marginSize,
            top: 1
          }
        },
        labels));
  },

  renderRowLabel: function (y) {
    return (
      r.div({
          key: "rl-" + y,
          className: "time-inspector-row-label",
          style: {
            height: this.props.rowHeight * 2,
            lineHeight: this.props.rowHeight * 2 + "px",
            top: (y - 1) * this.props.rowHeight,
            right: 2
          }
        },
        this.props.makeRowLabel(this.props.rowCount - y)));
  },

  renderSelectedRow: function () {
    var x = this.props.selectedColumn;
    var v = this.props.columnValues[x];
    return (
      r.div({
          className: "time-inspector-row selected",
          style: {
            width: this.props.columnCount * this.props.columnWidth,
            height: Math.ceil(this.props.rowCount * this.props.rowHeight * v) - 1,
            left: 1,
            bottom: 1
          }
        }));
  },

  renderSelectedColumnLabels: function () {
    var x = this.props.selectedColumn;
    return (
      r.div({
          className: "time-inspector-column-labels selected",
          style: {
            width: this.props.columnCount * this.props.columnWidth,
            height: this.props.marginSize,
            left: 1,
            top: -this.props.marginSize
          }
        },
        r.div({
            className: "time-inspector-column-label selected",
            style: {
              width: this.props.columnWidth * 4,
              left: (x - 1.5) * this.props.columnWidth,
              bottom: 2
            }
          },
          this.props.makeColumnLabel(x) + "—" + this.props.makeColumnLabel(x + 1))));
  },

  renderSelectedRowLabels: function () {
    var x = this.props.selectedColumn;
    var v = this.props.columnValues[x];
    return (
      r.div({
          className: "time-inspector-row-labels selected",
          style: {
            width: this.props.marginSize,
            height: this.props.rowCount * this.props.rowHeight,
            top: 1,
            right: -this.props.marginSize
          }
        },
        r.div({
            className: "time-inspector-row-label selected",
            style: {
              height: this.props.rowHeight,
              lineHeight: this.props.rowHeight + "px",
              left: 2,
              top: Math.ceil(this.props.rowCount * this.props.rowHeight * (1 - v)) - (this.props.rowHeight / 2),
            }
          },
          v.toFixed(2))));
  },

  render: function () {
    return (r.div({}));
    return (
      r.div({
          className: "time-inspector",
          style: {
            width: this.props.columnCount * this.props.columnWidth + 5,
            height: this.props.rowCount * this.props.rowHeight + 5,
            left: this.props.marginSize,
            bottom: this.props.marginSize
          }
        },
        this.renderColumns(),
        this.renderRows(),
        this.renderColumnLabels(),
        this.renderRowLabels(),
        this.renderSelectedRow(),
        this.renderSelectedColumnLabels(),
        this.renderSelectedRowLabels()));
  }
};

r.makeComponent("TimeInspector", module);
