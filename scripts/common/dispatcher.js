'use strict';

var FluxDispatcher = require('flux').Dispatcher;
var utils = require('./utils');

function Dispatcher() {}

Dispatcher.prototype = utils.assign(new FluxDispatcher(), {
  debugDispatch: function (action) {
    console.log(action.type, action);
    this.dispatch(action);
  }
});

module.exports = new Dispatcher();
