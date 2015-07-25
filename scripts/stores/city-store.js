'use strict';

var Store = require('../common/store');
var dispatcher = require('../common/dispatcher');
var utils = require('../common/utils');

var cityGen = require('../city-generator');

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
    utils.assign(this, cityGen.genCity());
  },

  getNodes: function () {
    return this.nodes;
  },
  
  getEdges: function () {
    return this.edges;
  }
});

module.exports = new CityStore();
