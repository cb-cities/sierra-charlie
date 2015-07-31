'use strict';

var Store = require('../common/store');
var dispatcher = require('../common/dispatcher');
var utils = require('../common/utils');

function encodeSelection(selection) {
  if (!selection) {
    return '#';
  }
  switch (selection.type) {
    case 'edge':
      return '#E' + selection.id;
  }
}

function decodeSelection(hash) {
  if (!hash || hash[0] !== '#') {
    return undefined;
  }
  switch (hash[1]) {
    case 'E':
      return {
        type: 'edge',
        id:   parseInt(hash.slice(2))
      };
  }
}

function SelectionStore() {
  var selection = decodeSelection(location.hash);
  this.selection = selection;
  this.publish();
  this.dispatchToken = dispatcher.register(function (action) {
      switch (action.type) {
        case 'selectEdge':
          this.selectObject({
              type: 'edge',
              id:   action.edgeId
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

  getSelectedEdge: function () {
    return (
      (this.selection && this.selection.type === 'edge') ?
        this.selection.id :
        undefined);
  }
});

module.exports = new SelectionStore();
