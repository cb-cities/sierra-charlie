"use strict";

var r = require("./react");

module.exports = {
  propTypes: function () {
    return {
      columnIx: r.propTypes.number.isRequired,
      rowIx: r.propTypes.number.isRequired
    };
  },

  render: function () {
    return (
      r.div({
          className: "dummy",
          style: {
            width: "100%",
            height: "100%",
            color: "#999",
            padding: "1em",
            boxSizing: "border-box",
            background: "#fff",
            border: "1px #ccc solid"
          },
          onClick: function () {
            console.log("click", this.props.columnIx, this.props.rowIx);
          }.bind(this)
        },
        "(" + this.props.columnIx + ", " + this.props.rowIx + ")"));
  }
};

r.makeComponent("Dummy", module);
