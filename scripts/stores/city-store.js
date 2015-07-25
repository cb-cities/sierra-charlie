'use strict';

var Store = require('../common/store');
var dispatcher = require('../common/dispatcher');
var utils = require('../common/utils');
var gen = require('../gen');

function CityStore() {
  this.dispatchToken = dispatcher.register(function (action) {
      switch (action.type) {
        case 'genCity':
          this.genCity();
          this.publish();
          break;
      }
    }.bind(this));
}

CityStore.prototype = utils.assign(new Store(), {
  genCity: function () {
    utils.assign(this, gen.genCity());
  },

  getNodes: function () {
    return this.nodes;
  }
});

module.exports = new CityStore();
