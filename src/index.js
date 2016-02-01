"use strict";

require("./index.html");
require("./index.css");
require("./index.appcache");

window.React = require("react/addons");
const r = require("react-wrapper");

const Controller = require("./js/Controller");
const ViewManager = require("./js/ViewManager");
const app = r.wrap(require("./js/App"));

window.makeNative = (Elm, moduleName, makeValues) => {
  Elm.Native = Elm.Native || {};
  Elm.Native[moduleName] = {
    make: (localRuntime) => {
      localRuntime.Native = localRuntime.Native || {};
      localRuntime.Native[moduleName] = localRuntime.Native[moduleName] || {};
      localRuntime.Native[moduleName].values = localRuntime.Native[moduleName].values || makeValues(localRuntime);
      return localRuntime.Native[moduleName].values;
    }
  };
};

window.ViewManager = new ViewManager({
  onActiveViewsUpdated: (activeViews) => {
    if (window.UI) { // TODO
      window.UI.updateActiveViews(activeViews);
    }
    if (window.App) { // TODO
      window.App.isDrawingNeeded = true;
      window.App.renderContents();
    }
  }
});

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
  },

  chooseViews: (names) => {
    window.ViewManager.setActiveViews(names);
  },

  saveRoutesAsJSON: () => {
    controller.saveRoutesAsJSON();
  },

  saveAdjustmentAsJSON: () => {
    controller.saveAdjustmentAsJSON();
  }
});

window.UI.updateViewGroups(window.ViewManager.quoteViewGroups());
window.UI.updateActiveViews(window.ViewManager.quoteActiveViews()); // TODO
