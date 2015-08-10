"use strict";

var r = require("./react");
var scroller = r.wrap(require("./scroller"));
var dummy = r.wrap(require("./dummy"));

module.exports = {
  render: function () {
    return (
      scroller({
          columnCount: 50,
          columnWidth: 500,
          rowCount: 50,
          rowHeight: 500,
          cellChild: dummy
        }));
  }
};

r.makeComponent("App", module);
