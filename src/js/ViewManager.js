"use strict";

const Labeling = require("./Labeling");
const defs = require("./defs");
const webgl = require("./lib/webgl");

const defaultViewGroups = require("../json/default-views.json");
const defaultActiveViews = ["Road Nodes", "Road Links"];


function fromBool(value) {
  return value ? 0xFF : 0x00;
}

function quoteLambda(lambda) {
  return lambda.toString();
}

function unquoteLambda(quoted) {
  return eval("(" + quoted + ")");
}


function View(name, lambda) {
  this._name = name;
  this._lambda = lambda;
  this._includedNodeCount = 0;
  this._includedLinkCount = 0;
  this._labeling = undefined;
}

function unquoteView(quoted) {
  return new View(quoted.name, unquoteLambda(quoted.lambda));
}

View.prototype = {
  quote: function () {
    return {
      name: this._name,
      lambda: quoteLambda(this._lambda)
    };
  },

  includeNodes: function (nodes) {
    this._labeling = this._labeling || new Labeling(Uint8Array);
    for (let i = this._includedNodeCount; i < nodes.length; i++) {
      const node = nodes[i];
      this._labeling.setNodeLabel(node, fromBool(this._lambda("Road Node", node)));
    }
    this._includedNodeCount = nodes.length;
    return this._labeling;
  },

  includeLinks: function (links) {
    this._labeling = this._labeling || new Labeling(Uint8Array);
    for (let i = this._includedLinkCount; i < links.length; i++) {
      const link = links[i];
      this._labeling.setLinkLabel(link, fromBool(this._lambda("Road Link", link)));
    }
    this._includedLinkCount = links.length;
    return this._labeling;
  },

  getName: function () {
    return this._name;
  },

  getLabeling: function () {
    this._labeling = this._labeling || new Labeling(Uint8Array);
    return this._labeling;
  }
};


function ViewGroup(name, views) {
  this._name = name;
  this._views = views;
}

function unquoteViewGroup(quoted) {
  return new ViewGroup(quoted.name, quoted.views.map(unquoteView));
}

ViewGroup.prototype = {
  quoteViews: function () {
    return this._views.map((view) => {
      return view.quote();
    });
  },

  quote: function () {
    return {
      name: this._name,
      views: this.quoteViews()
    };
  },

  lookupView: function (name) {
    for (let i = 0; i < this._views.length; i++) {
      if (this._views[i].getName() === name) {
        return this._views[i];
      }
    }
    return null;
  }
};


function ViewManager(props) {
  this._props = props || {};
  this._viewGroups = defaultViewGroups.map(unquoteViewGroup);
  this._activeViews = [];
  this._activeLabeling = new Labeling(Uint8Array);
  this._includedNodes = [];
  this._includedLinks = [];
  this._dirty = false;
  this._texture = undefined;
  this._token = undefined;
  this.setActiveViews(defaultActiveViews);
}

ViewManager.prototype = {
  quoteViewGroups: function () {
    return this._viewGroups.map((viewGroup) => {
      return viewGroup.quote();
    });
  },

  quoteActiveViews: function () {
    return this._activeViews.map((view) => {
      return view.quote();
    });
  },

  lookupView: function (name) {
    for (let i = 0; i < this._viewGroups.length; i++) {
      const view = this._viewGroups[i].lookupView(name);
      if (view) {
        return view;
      }
    }
    return null;
  },

  setActiveViews: function (names) {
    this._activeViews = names.map((name) => {
      return this.lookupView(name);
    });
    if (!this._activeViews.length) {
      this._activeLabeling.clear();
    } else {
      this._activeViews[0].includeNodes(this._includedNodes);
      this._activeViews[0].includeLinks(this._includedLinks);
      this._activeLabeling.copy(this._activeViews[0].getLabeling());
      for (let i = 1; i < this._activeViews.length; i++) {
        const view = this._activeViews[i];
        view.includeNodes(this._includedNodes);
        view.includeLinks(this._includedLinks);
        this._activeLabeling.includeLabeling(view.getLabeling());
      }
    }
    this._dirty = true;
    if (this._props.onActiveViewsUpdated) {
      this._props.onActiveViewsUpdated(this.quoteActiveViews());
    }
  },

  includeNodes: function (nodes) {
    this._includedNodes.push.apply(this._includedNodes, nodes);
    this._activeViews.forEach((view) => {
      const labeling = view.includeNodes(this._includedNodes);
      this._activeLabeling.includeNodes(labeling, nodes);
    });
    this._dirty = true;
  },

  includeLinks: function (links) {
    this._includedLinks.push.apply(this._includedLinks, links);
    this._activeViews.forEach((view) => {
      const labeling = view.includeLinks(this._includedLinks);
      this._activeLabeling.includeLinks(labeling, links);
    });
    this._dirty = true;
  },

  getTexture: function (gl, token) {
    if (!this._texture || this._token !== token) {
      gl.deleteTexture(this._texture);
      this._texture = webgl.createTexture(gl);
      this._token = token;
      this._dirty = true;
    }
    if (this._dirty) {
      const data = this._activeLabeling.getData();
      webgl.updateTexture(gl, this._texture, gl.ALPHA, defs.textureSize, data);
      this._dirty = false;
    }
    return this._texture;
  },

  isNodeVisible: function (node) {
    return !!this._activeLabeling.getNodeLabel(node);
  },

  isLinkVisible: function (link) {
    return !!this._activeLabeling.getLinkLabel(link);
  }
};

module.exports = ViewManager;
