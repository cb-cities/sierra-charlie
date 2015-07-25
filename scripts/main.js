'use strict';

var r = require('./common/react');
var utils = require('./common/utils');

var a = require('./actions');
var mainView = require('./views/main-view');

window.main = function () {
  utils.detectTouch();
  r.render(mainView(), document.getElementById('main'));
  a.genCity();
};
