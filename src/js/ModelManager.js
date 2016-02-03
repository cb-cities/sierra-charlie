"use strict";

const Labeling = require("./Labeling");
const code = require("./lib/code");
const color = require("./lib/color");
const defs = require("./defs");
const webgl = require("./lib/webgl");

const defaultModelGroups = require("../json/default-models.json");
const defaultActiveModel = "Empty";


function isVisible(int) {
  return color.fromLEUint32toRGBA(int)[3] !== 0;
}


function Model(name, lambda, range, colors) {
  this._name = name;
  this._lambda = lambda;
  this._range = range;
  this._colors = colors;
  this._includedNodeCount = 0;
  this._includedLinkCount = 0;
  this._labeling = undefined;
  
  this._maxValue = 0;
  this._meanValue = 0;
  this._valueCount = 0;
}

function unquoteModel(quoted) {
  const lambda = code.unquote(quoted.lambda);
  let range = null;
  if (quoted.range) {
    range = {
      min: quoted.range.min,
      max: quoted.range.max
    };
  }
  let colors = {
    min: null,
    max: null,
    out: null
  };
  if (quoted.colors) {
    colors.min = quoted.colors.min || null;
    colors.max = quoted.colors.max || null;
    colors.out = quoted.colors.out || null;
  }
  return new Model(quoted.name, lambda, range, colors);
}

Model.prototype = {
  quote: function () {
    return {
      name: this._name,
      lambda: code.quote(this._lambda),
      range: this._range,
      colors: {
        min: this._colors.min,
        max: this._colors.max,
        out: this._colors.out
      }
    };
  },
  
  computeResult: function (type, feature) {
    const result = this._lambda(type, feature);
    if (result) {
      if (result.value > this._maxValue) { // TODO: Remove
        this._maxValue = result.value;
      }
      this._meanValue = (result.value + this._valueCount * this._meanValue) / (this._valueCount + 1);
      this._valueCount++;
      
      if (this._range) {
        return {
          value: result.value,
          color: color.lerpRGBA(this._colors.min, this._colors.max, result.value)
        };
      } else {
        return {
          value: result.value,
          color: this._colors.out
        };
      }
    } else {
      return {
        color: this._colors.out
      };
    }
  },

  includeNodes: function (nodes) {
    this._labeling = this._labeling || new Labeling(Uint32Array);
    for (let i = this._includedNodeCount; i < nodes.length; i++) {
      const node = nodes[i];
      const result = this.computeResult("Road Node", node);
      this._labeling.setNodeLabel(node, color.fromRGBAtoLEUint32(result.color));
    }
    this._includedNodeCount = nodes.length;
    return this._labeling;
  },

  includeLinks: function (links) {
    this._labeling = this._labeling || new Labeling(Uint32Array);
    for (let i = this._includedLinkCount; i < links.length; i++) {
      const link = links[i];
      const result = this.computeResult("Road Link", link);
      this._labeling.setLinkLabel(link, color.fromRGBAtoLEUint32(result.color));
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
  this._activeLabeling = undefined;
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
      this._activeLabeling = this._activeModel.getLabeling();
      this._activeModel.includeNodes(this._includedNodes);
      this._activeModel.includeLinks(this._includedLinks);
      console.log({
        name: this._activeModel._name,
        max: this._activeModel._maxValue,
        mean: this._activeModel._meanValue,
        count: this._activeModel._valueCount
      });
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
      const data = ( // FIXME
        this._activeLabeling ?
          new Uint8Array(this._activeLabeling.getData().buffer) :
          new Uint8Array(defs.textureDataSize * 4));
      webgl.updateTexture(gl, this._texture, gl.RGBA, defs.textureSize, data);
      this._dirty = false;
    }
    return this._texture;
  },

  isNodeVisible: function (node) {
    return this._activeLabeling && isVisible(this._activeLabeling.getNodeLabel(node));
  },

  isLinkVisible: function (link) {
    return this._activeLabeling && isVisible(this._activeLabeling.getLinkLabel(link));
  }
};

module.exports = ModelManager;
