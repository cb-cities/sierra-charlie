"use strict";

require("./index.html");
require("./index.css");
require("./index.appcache");

window.React = require("react/addons");
const r = require("react-wrapper");

const Controller = require("./js/Controller");
const app = r.wrap(require("./js/App"));
const UI = require("./js/UI");


const controller = window.Controller = new Controller();

window.App = r.render(app(), document.getElementById("app"));

window.UI = new UI({
  setMode: (mode) => {
    controller.setMode(mode);
  },

  highlightFeatureByTOID: (toid) => {
    controller.highlightFeatureByTOID(toid);
  },

  selectFeatureByTOID: (toid) => {
    controller.selectFeatureByTOID(toid);
  },

  deleteSelectedFeature: () => {
    controller.deleteSelectedFeature();
  },

  undeleteSelectedFeature: () => {
    controller.undeleteSelectedFeature();
  },

  clearRoutes: () => {
    controller.clearRoutes();
  },

  clearAdjustment: () => {
    controller.clearAdjustment();
  }
});
