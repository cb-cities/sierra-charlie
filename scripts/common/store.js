'use strict';

var utils = require('./utils');

function Store() {
  this._subscribers = [];
}

Store.prototype = {
  subscribe: function (cb) {
    this._subscribers.push(cb);
  },

  unsubscribe: function (cb) {
    this._subscribers.splice(this._subscribers.indexOf(cb), 1);
  },

  publish: function () {
    setTimeout(function () {
        this._subscribers.forEach(function (cb) {
            cb();
          });
      }.bind(this),
      0);
  },

  store: function (key, value) {
    this[key] = value;
    utils.storeJson(key, value);
  },

  load: function (key, defaultValue) {
    this[key] = utils.loadJson(key, defaultValue);
  }
};

module.exports = Store;
