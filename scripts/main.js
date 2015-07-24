'use strict';

var r = require('./common/react');
var utils = require('./common/utils');
var browser = require('./views/browser');

window.main = function () {
  utils.detectTouch();
  r.render(browser(), document.getElementById('main'));
};
