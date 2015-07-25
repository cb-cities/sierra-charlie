'use strict';

var dispatcher = require('./common/dispatcher');

module.exports = {
  genCity: function () {
    dispatcher.dispatch({
        type: 'genCity'
      });
  }
};
