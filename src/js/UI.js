"use strict";

const Elm = require("../elm/UI.elm");


function UI(props) {
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
      viewGroups: [],
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
  this.updateViewGroups = (viewGroups) => {
    send({
      tag: "UpdateViewGroups",
      viewGroups: viewGroups
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
        props.setMode(message.strings[0]);
        break;
      case "HighlightFeatureByTOID":
        props.highlightFeatureByTOID(message.strings[0]);
        break;
      case "SelectFeatureByTOID":
        props.selectFeatureByTOID(message.strings[0]);
        break;
      case "DeleteSelectedFeature":
        props.deleteSelectedFeature();
        break;
      case "UndeleteSelectedFeature":
        props.undeleteSelectedFeature();
        break;
      case "ClearRoutes":
        props.clearRoutes();
        break;
      case "ClearAdjustment":
        props.clearAdjustment();
        break;
      case "ChooseViews":
        props.chooseViews(message.strings);
        break;
      default:
        throw new Error("Invalid outgoing message: " + message.tag);
    }
  };
  localRuntime.ports.outgoingMessage.subscribe(this.receive);

  this.receiveSpecial = (message) => {
    switch (message) {
      case "SaveRoutesAsJSON":
        props.saveRoutesAsJSON();
        break;
      case "SaveAdjustmentAsJSON":
        props.saveAdjustmentAsJSON();
        break;
      default:
        throw new Error("Invalid special outgoing message: " + message);
    }
  };
}

module.exports = UI;
