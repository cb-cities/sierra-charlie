"use strict";

var compute = require("./compute");


function Controller(props) {
  this.props = props;
}

Controller.prototype = {
  onDoubleClick: function (event) {
    // console.log("doubleClick", event.clientX, event.clientY);
    var clientWidth = App.getClientWidth();
    var clientHeight = App.getClientHeight();
    var left = App.getStaticLeft();
    var top = App.getStaticTop();
    var zoom = App.getStaticZoom();
    var newLeft = compute.leftFromEventClientX(event.clientX, clientWidth, left, zoom);
    var newTop = compute.topFromEventClientY(event.clientY, clientHeight, top, zoom);
    var newZoom = event.altKey ? Math.min(zoom + 1, this.props.maxZoom) : Math.max(0, zoom - 1);
    var duration = event.shiftKey ? 2500 : 500;
    App.setLeft(newLeft, duration);
    App.setTop(newTop, duration);
    App.setZoom(newZoom, duration);
  },

  onKeyDown: function (event) {
    // console.log("keyDown", event.keyCode);
    var clientWidth = App.getClientWidth();
    var clientHeight = App.getClientHeight();
    var left = App.getStaticLeft();
    var top = App.getStaticTop();
    var rawTime = App.getStaticRawTime();
    var zoom = App.getStaticZoom();
    var pageWidth = compute.pageWidth(clientWidth, zoom);
    var pageHeight = compute.pageHeight(clientHeight, zoom);
    var duration = event.shiftKey ? 2500 : 500;
    // var timeDelta = (event.ctrlKey || event.altKey) ? 60 : 3600;
    var zoomDelta = (event.altKey || event.ctrlKey) ? 2 : 10;
    switch (event.keyCode) {
      case 37: // left
      case 36: // home
        var newLeft = Math.max(0, left - pageWidth / (event.keyCode === 36 ? 1 : 10));
        App.setLeft(newLeft, duration);
        break;
      case 39: // right
      case 35: // end
        var newLeft = Math.min(left + pageWidth / (event.keyCode === 35 ? 1 : 10), 1);
        App.setLeft(newLeft, duration);
        break;
      case 38: // up
      case 33: // page up
        var newTop = Math.max(0, top - pageHeight / (event.keyCode === 33 ? 1 : 10));
        App.setTop(newTop, duration);
        break;
      case 40: // down
      case 34: // page down
        var newTop = Math.min(top + pageHeight / (event.keyCode === 34 ? 1 : 10), 1);
        App.setTop(newTop, duration);
        break;
      // case 219: // left bracket
      //   var newRawTime = Math.round((rawTime * 3600) - timeDelta) / 3600;
      //   App.setRawTime(newRawTime, duration);
      //   break;
      // case 221: // right bracket
      //   var newRawTime = Math.round((rawTime * 3600) + timeDelta) / 3600;
      //   App.setRawTime(newRawTime, duration);
      //   break;
      case 187: // plus
        var newZoom = Math.max(0, (Math.round((zoom * 10) - zoomDelta) / 10));
        App.setZoom(newZoom, duration);
        break;
      case 189: // minus
        var newZoom = Math.min(Math.round((zoom * 10) + zoomDelta) / 10, this.props.maxZoom);
        App.setZoom(newZoom, duration);
        break;
      default: // 1-8
        if (event.keyCode >= 49 && event.keyCode <= 57) {
          var newZoom = Math.max(0, Math.min(event.keyCode - 49, this.props.maxZoom));
          App.setZoom(newZoom, duration);
        }
    }
  }
};

module.exports = Controller;
