"use strict";

require("./index.html");
require("./index.css");
require("./index.appcache");

window.React = require("react/addons");
const r = require("react-wrapper");

const Controller = require("./js/Controller");
const ModelManager = require("./js/ModelManager");
const ViewManager = require("./js/ViewManager");
const app = r.wrap(require("./js/App"));

window.rect = require("./js/lib/rect"); // TODO
window.vector = require("./js/lib/vector"); // TODO


// detect IE and returns version of IE or false, if browser is not IE
function detectIE() {
  const ua = window.navigator.userAgent;
  
  const msie = ua.indexOf("MSIE ");
  if (msie > 0) {
    // IE 10 or older => return version number
    return parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)), 10);
  }

  const trident = ua.indexOf("Trident/");
  if (trident > 0) {
    // IE 11 => return version number
    const rv = ua.indexOf("rv:");
    return parseInt(ua.substring(rv + 3, ua.indexOf(".", rv)), 10);
  }

  const edge = ua.indexOf("Edge/");
  if (edge > 0) {
    // Edge (IE 12+) => return version number
    return parseInt(ua.substring(edge + 5, ua.indexOf(".", edge)), 10);
  }
    
  // other browser
  return false;
}

const version = detectIE();

if (version !== false) {
  window.alert("Please use Chromium / Firefox / Google Chrome for a better experience!");
}

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

window.ModelManager = new ModelManager({
  onActiveModelUpdated: (activeModel) => {
    if (window.UI) { // TODO
      window.UI.updateActiveModel(activeModel);
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

  chooseModel: (name) => {
    window.ModelManager.setActiveModel(name);
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

window.UI.updateModelGroups(window.ModelManager.quoteModelGroups());
window.UI.updateActiveModel(window.ModelManager.quoteActiveModel()); // TODO

window.circularEaseIn = (x) => {
  return 1 - Math.sqrt(1 - Math.pow(x, 2));
};

window.circularEaseOut = (x) => {
  return Math.sqrt(1 - Math.pow(1 - x, 2));
};


const MullickRay = require("./js/MullickRay"); // FIXME

window.travelTime = function (type, feature, hour) {
  if (type === "Road Link") {
    const LondonEye = [530629.9181099398, 179433.27356557376];
    const maxDistance = 52753.331350433284;
    const meanTrafficSpeed = 28.6463;
    const meanLength = 86.27147681632832;
    const point = window.rect.midpoint(feature.bounds);
    const distance = window.vector.distance(point, LondonEye) / maxDistance;
    const revDistance = 1 - distance;
    const freeTravelTime = feature.length / meanTrafficSpeed;
    const capacity = 0.5 + (feature.length / meanLength) / 2;
    const volume = 20 * (Math.random() + 5 * MullickRay.figure1(hour)) * revDistance;
    const travelTime = freeTravelTime * (1 + volume / capacity) / feature.length;
    const maxTravelTime = 7.386860121944193;
    return {
      value: window.circularEaseOut(travelTime / maxTravelTime)
    };
  } else {
    return null;
  }
};
