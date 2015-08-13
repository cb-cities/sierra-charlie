"use strict";

var r = require("./react");
var scrollerCell = r.wrap(require("./scroller-cell"));

module.exports = {
  propTypes: function () {
    return {
      columnCount: r.propTypes.number.isRequired,
      columnWidth: r.propTypes.number.isRequired,
      rowCount: r.propTypes.number.isRequired,
      rowHeight: r.propTypes.number.isRequired,
      cellChild: r.propTypes.func.isRequired,
      cells: r.propTypes.array.isRequired
    };
  },

  render: function () {
    return (
      r.div({
          className: "scroller-content",
          style: {
            width: this.props.columnCount * this.props.columnWidth,
            height: this.props.rowCount * this.props.rowHeight,
            position: "relative"
          }
        },
        this.props.cells.map(function (cell) {
            return (
              scrollerCell({
                  key: "sc-" + cell.columnIx + "-" + cell.rowIx,
                  columnWidth: this.props.columnWidth,
                  rowHeight: this.props.rowHeight,
                  cellChild: this.props.cellChild,
                  columnIx: cell.columnIx,
                  rowIx: cell.rowIx,
                  isCellVisible: true
                }));
          }.bind(this))));
  }
};

r.makeComponent("ScrollerContent", module);
