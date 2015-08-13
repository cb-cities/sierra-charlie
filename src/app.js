"use strict";

var r = require("./react");
var scroller = r.wrap(require("./scroller"));
var dummy = r.wrap(require("./dummy"));

module.exports = {
  render: function () {
    return (
      scroller({
          columnCount: 89,
          columnWidth: 1000,
          rowCount: 56,
          rowHeight: 1000,
          cellChild: dummy
        }));
  }
};

r.makeComponent("App", module);
