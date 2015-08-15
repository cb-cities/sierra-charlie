"use strict";

var r = require("react-wrapper");
var lazyScroller = r.wrap(require("lazy-scroller"));
var dummy = r.wrap(require("./dummy"));

module.exports = {
  render: function () {
    return (
      lazyScroller({
          columnCount: 86,
          columnWidth: 1000,
          rowCount: 65,
          rowHeight: 1000,
          tileChild: dummy
        }));
  }
};

r.makeComponent("App", module);
