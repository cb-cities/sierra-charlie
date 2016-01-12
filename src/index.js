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
      mode: null,
      loadingProgress: 0,
      highlightedFeature: null,
      selectedFeature: null
    });
  window.UI.ports.setMode.subscribe(function (mode) {
      controller.setMode(mode);
    });
  window.UI.ports.highlightFeature.subscribe(function (toid) {
      controller.highlightFeatureByTOID(toid);
    });
  window.UI.ports.selectFeature.subscribe(function (toid) {
      controller.selectFeatureByTOID(toid);
    });
  window.UI.ports.deleteSelectedFeature.subscribe(function () {
      controller.deleteSelectedFeature();
    });
  window.UI.ports.undeleteSelectedFeature.subscribe(function () {
      controller.undeleteSelectedFeature();
    });
})();
