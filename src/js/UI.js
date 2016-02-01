"use strict";

const Elm = require("../elm/UI.elm");


function UI(callbacks) {
  const localRuntime = Elm.embed(Elm.UI, document.getElementById("ui"), {
    incomingMessage: null
  });

  function send(message) {
    localRuntime.ports.incomingMessage.send(Object.assign({
      mode: null,
      loadingProgress: 0,
      feature: null,
      routes: [],
      adjustment: null,
      activeViews: []
    }, message));
  }
  this.updateMode = (mode) => {
    send({
      tag: "UpdateMode",
      mode: mode
    });
  };
  this.updateLoadingProgress = (loadingProgress) => {
    send({
      tag: "UpdateLoadingProgress",
      loadingProgress: loadingProgress
    });
  };
  this.updateHighlightedFeature = (feature) => {
    send({
      tag: "UpdateHighlightedFeature",
      feature: feature
    });
  };
  this.updateSelectedFeature = (feature) => {
    send({
      tag: "UpdateSelectedFeature",
      feature: feature
    });
  };
  this.updateRoutes = (routes) => {
    send({
      tag: "UpdateRoutes",
      routes: routes
    });
  };
  this.updateAdjustment = (adjustment) => {
    send({
      tag: "UpdateAdjustment",
      adjustment: adjustment
    });
  };
  this.updateActiveViews = (activeViews) => {
    send({
      tag: "UpdateActiveViews",
      activeViews: activeViews
    });
  };

  this.receive = (message) => {
    switch (message.tag) {
      case "SetMode":
        callbacks.setMode(message.strings[0]);
        break;
      case "HighlightFeatureByTOID":
        callbacks.highlightFeatureByTOID(message.strings[0]);
        break;
      case "SelectFeatureByTOID":
        callbacks.selectFeatureByTOID(message.strings[0]);
        break;
      case "DeleteSelectedFeature":
        callbacks.deleteSelectedFeature();
        break;
      case "UndeleteSelectedFeature":
        callbacks.undeleteSelectedFeature();
        break;
      case "ClearRoutes":
        callbacks.clearRoutes();
        break;
      case "ClearAdjustment":
        callbacks.clearAdjustment();
        break;
      case "ChooseViews":
        callbacks.chooseViews(message.strings);
        break;
      default:
        throw new Error("Invalid outgoing message: " + message.tag);
    }
  };
  localRuntime.ports.outgoingMessage.subscribe(this.receive);

  this.receiveSpecial = (message) => {
    switch (message) {
      case "SaveRoutesAsJSON":
        callbacks.saveRoutesAsJSON();
        break;
      case "SaveAdjustmentAsJSON":
        callbacks.saveAdjustmentAsJSON();
        break;
      default:
        throw new Error("Invalid special outgoing message: " + message);
    }
  };
}

module.exports = UI;
