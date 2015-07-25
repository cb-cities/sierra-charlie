'use strict';

var Store = require('../common/store');
var dispatcher = require('../common/dispatcher');
var utils = require('../common/utils');

function encodeSelection(selection) {
  if (!selection) {
    return '#';
  }
  switch (selection.type) {
    case 'node':
      return '#n' + selection.ix;
    case 'edge':
      return '#e' + selection.ix;
  }
}

function decodeSelection(hash) {
  if (!hash || hash[0] !== '#') {
    return undefined;
  }
  switch (hash[1]) {
    case 'n':
      return {
        type: 'node',
        ix:   parseInt(hash.slice(2))
      };
    case 'e':
      return {
        type: 'edge',
        ix:   parseInt(hash.slice(2))
      };
  }
}

function SelectionStore() {
  var selection = decodeSelection(location.hash);
  this.selection = selection;
  this.publish();
  this.dispatchToken = dispatcher.register(function (action) {
      switch (action.type) {
        case 'selectNode':
          this.selectObject({
              type: 'node',
              ix:   action.nodeIx
            });
          this.publish();
          break;
        case 'selectEdge':
          this.selectObject({
              type: 'edge',
              ix:   action.edgeIx
            });
          this.publish();
          break;
        case 'deselect':
          this.selectObject(undefined);
          this.publish();
          break;
      }
    }.bind(this));
  addEventListener('popstate', function (event) {
      var selection = (
        !event.state ?
          decodeSelection(location.hash) :
          event.state.selection);
      this.selection = selection;
      this.publish();
    }.bind(this));
}

SelectionStore.prototype = utils.assign(new Store(), {
  selectObject: function (selection) {
    var hash = encodeSelection(selection);
    this.selection = selection;
    history.pushState({
        selection: selection
      }, '', hash);
  },

  getSelectedNode: function () {
    return (
      (this.selection && this.selection.type === 'node') ?
        this.selection.ix :
        undefined);
  },

  getSelectedEdge: function () {
    return (
      (this.selection && this.selection.type === 'edge') ?
        this.selection.ix :
        undefined);
  }
});

module.exports = new SelectionStore();
