"use strict";

var r = require("react-wrapper");
var u = require("./utils");
var scrollerContent = r.wrap(require("./scroller-content"));
var scrollerMap = r.wrap(require("./scroller-map"));

var Cell = function (columnIx, rowIx) {
  this.columnIx = columnIx;
  this.rowIx = rowIx;
  this.toString = function () {
    return "(" + this.columnIx + "," + this.rowIx + ")";
  };
};

module.exports = {
  propTypes: function () {
    return {
      columnCount: r.propTypes.number.isRequired,
      columnWidth: r.propTypes.number.isRequired,
      rowCount: r.propTypes.number.isRequired,
      rowHeight: r.propTypes.number.isRequired,
      cellChild: r.propTypes.func.isRequired
    };
  },

  getInitialState: function () {
    return {
      cells: [],
      visibleCells: []
    };
  },

  componentDidMount: function () {
    var node = r.domNode(this).firstChild;
    node.addEventListener("scroll", this.onScroll);
    addEventListener("resize", this.onResize);
    this.update(node, false);
  },

  componentWillUnmount: function () {
    var node = r.domNode(this).firstChild;
    node.removeEventListener("scroll", this.onScroll);
    removeEventListener("resize", this.onResize);
  },

  getFirstVisibleColumn: function (node) {
    return Math.min(Math.floor(node.scrollLeft / this.props.columnWidth), this.props.columnCount - 1);
  },

  getVisibleColumnCount: function (node, firstColumn) {
    return Math.min(Math.ceil((node.scrollLeft - (firstColumn * this.props.columnWidth) + node.clientWidth) / this.props.columnWidth), this.props.columnCount - firstColumn);
  },

  getFirstVisibleRow: function (node) {
    return Math.min(Math.floor(node.scrollTop / this.props.rowHeight), this.props.rowCount - 1);
  },

  getVisibleRowCount: function (node, firstRow) {
    return Math.min(Math.ceil((node.scrollTop - (firstRow * this.props.rowHeight) + node.clientHeight) / this.props.rowHeight), this.props.rowCount - firstRow);
  },

  getVisibleMetrics: function (node) {
    var firstColumn = this.getFirstVisibleColumn(node);
    var columnCount = this.getVisibleColumnCount(node, firstColumn);
    var firstRow = this.getFirstVisibleRow(node);
    var rowCount = this.getVisibleRowCount(node, firstRow);
    var margin = 0;
    if (firstColumn - margin >= 0) {
      firstColumn -= margin;
      columnCount += margin;
    }
    if (firstRow - margin >= 0) {
      firstRow -= margin;
      rowCount += margin;
    }
    if (firstColumn + columnCount + margin <= this.props.columnCount) {
      columnCount += margin;
    }
    if (firstRow + rowCount + margin <= this.props.rowCount) {
      rowCount += margin;
    }
    return {
      firstColumn: firstColumn,
      columnCount: columnCount,
      firstRow: firstRow,
      rowCount: rowCount
    };
  },

  getVisibleCells: function (metrics) {
    var visibleCells = [];
    u.generate(metrics.rowCount, function (rowIx) {
        u.generate(metrics.columnCount, function (columnIx) {
            visibleCells.push(new Cell(metrics.firstColumn + columnIx, metrics.firstRow + rowIx));
          });
      });
    return visibleCells;
  },

  update: function (node, isStretching) {
    var metrics = this.getVisibleMetrics(node);
    var visibleCells = this.getVisibleCells(metrics);
    var cells = isStretching ? u.copyUniqueElements(this.state.cells, visibleCells) : visibleCells;
    if (this.isMounted()) {
      this.setState({
          metrics: metrics,
          cells: cells,
          visibleCells: visibleCells
        });
    }
  },

  latch: function (node) {
    this.isLatched = true;
    this.latchTime = Date.now();
    this.lastScrollLeft = node.scrollLeft;
    this.lastScrollTop = node.scrollTop;
    this.lastScrollChangeX = 0;
    this.lastScrollChangeY = 0;
    this.update(node, false);
  },

  stretch: function (node, scrollChangeX, scrollChangeY) {
    this.lastScrollLeft = node.scrollLeft;
    this.lastScrollTop = node.scrollTop;
    this.lastScrollChangeX = scrollChangeX;
    this.lastScrollChangeY = scrollChangeY;
    this.update(node, true);
  },

  unlatch: function () {
    this.isLatched = false;
    this.latchTime = undefined;
    this.lastScrollLeft = undefined;
    this.lastScrollTop = undefined;
    this.lastScrollChangeX = undefined;
    this.lastScrollChangeY = undefined;
    if (this.isMounted()) {
      this.setState({
          cells: this.state.visibleCells
        });
    }
  },

  onScroll: function (event) {
    window.requestAnimationFrame(function () {
        var node = r.domNode(this).firstChild;
        if (!this.isLatched) {
          // console.log("latching (scroll started)");
          this.latch(node);
        } else {
          var scrollChangeX = this.lastScrollLeft - node.scrollLeft;
          var scrollChangeY = this.lastScrollTop - node.scrollTop;
          if (scrollChangeX * this.lastScrollChangeX < 0 || scrollChangeY * this.lastScrollChangeY < 0) {
            // console.log("latching (scroll direction changed)");
            this.latch(node);
          } else if (Date.now() - this.latchTime > 2000) {
            // console.log("latching (scroll continues)");
            this.latch(node);
          } else {
            // console.log("stretching");
            this.stretch(node, scrollChangeX, scrollChangeY);
          }
        }
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = setTimeout(function () {
            // console.log("unlatching");
            this.unlatch();
          }.bind(this),
          250);
      }.bind(this));
  },

  onResize: function (event) {
    window.requestAnimationFrame(function () {
        var node = r.domNode(this).firstChild;
        this.update(node, this.isLatched);
      }.bind(this));
  },

  render: function () {
    return (
      r.div({
          className: "scroller-wrapper",
          style: {
            width: "100%",
            height: "100%",
            position: "relative"
          }
        },
        r.div({
            className: "scroller",
            style: {
              width: "100%",
              height: "100%",
              overflow: "scroll",
              WebkitOverflowScrolling: "touch"
            }
          },
          scrollerContent({
              columnCount: this.props.columnCount,
              columnWidth: this.props.columnWidth,
              rowCount: this.props.rowCount,
              rowHeight: this.props.rowHeight,
              cellChild: this.props.cellChild,
              cells: this.state.cells
            })),
        scrollerMap({
            columnCount: this.props.columnCount,
            columnWidth: this.props.columnWidth,
            rowCount: this.props.rowCount,
            rowHeight: this.props.rowHeight,
            metrics: this.state.metrics,
            cells: this.state.cells
          })));
  }
};

r.makeComponent("Scroller", module);
