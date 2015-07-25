'use strict';

var r = require('./common/react');
var utils = require('./common/utils');

var mainView = require('./views/main-view');
var a = require('./actions');

window.main = function () {
  utils.detectTouch();
  r.render(mainView(), document.getElementById('main'));
  a.genCity();
};
