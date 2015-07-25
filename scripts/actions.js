'use strict';

var dispatcher = require('./common/dispatcher');

module.exports = {
  genCity: function () {
    dispatcher.dispatch({
        type: 'genCity'
      });
  },

  selectNode: function (nodeIx) {
    dispatcher.dispatch({
        type:   'selectNode',
        nodeIx: nodeIx
      });
  },

  selectEdge: function (edgeIx) {
    dispatcher.dispatch({
        type:   'selectEdge',
        edgeIx: edgeIx
      });
  },

  deselect: function () {
    dispatcher.dispatch({
        type: 'deselect'
      });
  }
};
