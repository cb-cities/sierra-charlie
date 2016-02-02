"use strict";

const Labeling = require("./Labeling");
const code = require("./lib/code");
const compute = require("./compute");
const defs = require("./defs");
const webgl = require("./lib/webgl");

const defaultModelGroups = require("../json/default-models.json");
const defaultActiveModel = "Empty";
const transparent = compute.fromRGBA([0, 0, 0, 0]);


function Model(name, lambda, colors) {
  this._name = name;
  this._lambda = lambda;
  this._colors = colors;
  this._includedNodeCount = 0;
  this._includedLinkCount = 0;
  this._labeling = undefined;
}

function unquoteModel(quoted) {
  return new Model(quoted.name, code.unquote(quoted.lambda), quoted.colors);
}

Model.prototype = {
  quote: function () {
    return {
      name: this._name,
      lambda: code.quote(this._lambda),
      colors: this._colors
    };
  },

  includeNodes: function (nodes) {
    this._labeling = this._labeling || new Labeling(Uint32Array);
    for (let i = this._includedNodeCount; i < nodes.length; i++) {
      const node = nodes[i];
      const color = this._colors[this._lambda("Road Node", node)];
      const label = color ? compute.fromRGBA(color) : transparent;
      this._labeling.setNodeLabel(node, label);
    }
    this._includedNodeCount = nodes.length;
    return this._labeling;
  },

  includeLinks: function (links) {
    this._labeling = this._labeling || new Labeling(Uint32Array);
    for (let i = this._includedLinkCount; i < links.length; i++) {
      const link = links[i];
      const color = this._colors[this._lambda("Road Link", link)];
      const label = color ? compute.fromRGBA(color) : transparent;
      this._labeling.setLinkLabel(link, label);
    }
    this._includedLinkCount = links.length;
    return this._labeling;
  },

  getName: function () {
    return this._name;
  },

  getLabeling: function () {
    this._labeling = this._labeling || new Labeling(Uint32Array);
    return this._labeling;
  }
};


function ModelGroup(name, models) {
  this._name = name;
  this._models = models;
}

function unquoteModelGroup(quoted) {
  return new ModelGroup(quoted.name, quoted.models.map(unquoteModel));
}

ModelGroup.prototype = {
  quoteModels: function () {
    return this._models.map((model) => {
      return model.quote();
    });
  },

  quote: function () {
    return {
      name: this._name,
      models: this.quoteModels()
    };
  },

  lookupModel: function (name) {
    for (let i = 0; i < this._models.length; i++) {
      if (this._models[i].getName() === name) {
        return this._models[i];
      }
    }
    return null;
  }
};


function ModelManager(props) {
  this._props = props || {};
  this._modelGroups = defaultModelGroups.map(unquoteModelGroup);
  this._activeModel = undefined;
  this._includedNodes = [];
  this._includedLinks = [];
  this._dirty = false;
  this._texture = undefined;
  this._token = undefined;
  this.setActiveModel(defaultActiveModel);
}

ModelManager.prototype = {
  quoteModelGroups: function () {
    return this._modelGroups.map((modelGroup) => {
      return modelGroup.quote();
    });
  },

  quoteActiveModel: function () {
    return this._activeModel.quote();
  },

  lookupModel: function (name) {
    for (let i = 0; i < this._modelGroups.length; i++) {
      const model = this._modelGroups[i].lookupModel(name);
      if (model) {
        return model;
      }
    }
    return null;
  },

  setActiveModel: function (name) {
    this._activeModel = this.lookupModel(name);
    if (this._activeModel) {
      this._activeModel.includeNodes(this._includedNodes);
      this._activeModel.includeLinks(this._includedLinks);
    }
    this._dirty = true;
    if (this._props.onActiveModelUpdated) {
      this._props.onActiveModelUpdated(this.quoteActiveModel());
    }
  },

  includeNodes: function (nodes) {
    this._includedNodes.push.apply(this._includedNodes, nodes);
    this._activeModel.includeNodes(this._includedNodes);
    this._dirty = true;
  },

  includeLinks: function (links) {
    this._includedLinks.push.apply(this._includedLinks, links);
    this._activeModel.includeLinks(this._includedLinks);
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
      const data = this._activeModel.getLabeling().getData();
      const newData = new Uint8Array(data.buffer); // FIXME
      webgl.updateTexture(gl, this._texture, gl.RGBA, defs.textureSize, newData);
      this._dirty = false;
    }
    return this._texture;
  }
};

module.exports = ModelManager;
