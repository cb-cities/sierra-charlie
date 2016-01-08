"use strict";

window.React = require("react/addons");
const r = require("react-wrapper");

const Controller = require("./js/Controller");
const app = r.wrap(require("./js/App"));
window.Elm = require("./elm/UI");

require("./index.html");
require("./index.css");
require("./index.appcache");


(function () {
  const controller = window.Controller = new Controller();
  window.App = r.render(app(), document.getElementById("app"));
  window.UI = Elm.embed(Elm.UI, document.getElementById("ui"), {
      setLoadingProgress: 0,
      setHighlightedFeature: null,
      setSelectedFeature: null,
    });
  let prevHoveredTOID = null;
  let prevClickedTOID = null;
  window.UI.ports.prevHoveredTOID.subscribe(function (toid) {
      if (toid !== prevHoveredTOID) {
        controller.highlightFeatureByTOID(toid);
        prevHoveredTOID = toid;
      }
    });
  window.UI.ports.prevClickedTOID.subscribe(function (toid) {
      if (toid !== prevClickedTOID) {
        controller.selectFeatureByTOID(toid);
        prevClickedTOID = toid;
      }
    });
})();
