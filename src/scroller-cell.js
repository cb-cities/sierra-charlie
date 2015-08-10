"use strict";

var r = require("./react");

module.exports = {
  propTypes: function () {
    return {
      columnWidth: r.propTypes.number.isRequired,
      rowHeight: r.propTypes.number.isRequired,
      cellChild: r.propTypes.func.isRequired,
      columnIx: r.propTypes.number.isRequired,
      rowIx: r.propTypes.number.isRequired,
      isCellVisible: r.propTypes.bool.isRequired
    };
  },

  render: function () {
    return (
      r.div({
          className: "scroller-cell",
          style: {
            width: this.props.columnWidth,
            height: this.props.rowHeight,
            position: "absolute",
            left: this.props.columnIx * this.props.columnWidth,
            top: this.props.rowIx * this.props.rowHeight,
          }
        },
        !this.props.isCellVisible ? null :
          this.props.cellChild({
              columnIx: this.props.columnIx,
              rowIx: this.props.rowIx,
              isVisible: this.props.isCellVisible
            })));
  }
};

r.makeComponent("ScrollerCell", module);
