'use strict';

var dispatcher = require('./common/dispatcher');

module.exports = {
  genCity: function () {
    dispatcher.dispatch({
        type: 'genCity'
      });
  },

  selectEdge: function (edgeId) {
    dispatcher.dispatch({
        type:   'selectEdge',
        edgeId: edgeId
      });
  },

  deselect: function () {
    dispatcher.dispatch({
        type: 'deselect'
      });
  }
};
