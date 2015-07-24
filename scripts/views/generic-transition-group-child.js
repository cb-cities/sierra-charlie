'use strict';

var r = require('../common/react');

// NOTE: TRANSITION_DURATION must match $transition-duration in CSS
var TRANSITION_DURATION = 250;
var TICK = 5;

var _ = {
  propTypes: function () {
    return {
      transitionName:  r.propTypes.string.isRequired,
      transitionEnter: r.propTypes.bool,
      transitionLeave: r.propTypes.bool
    };
  },

  componentWillEnter: function (callback) {
    if (!this.props.transitionEnter) {
      callback();
      return;
    }
    var name = this.props.transitionName;
    var node = r.findDOMNode(this);
    switch (name) {
      case 'height':
        var height = getComputedStyle(node).getPropertyValue('height');
        node.classList.add('height-enter');
        node.style.maxHeight = '0px';
        setTimeout(function () {
            node.classList.add('height-enter-active');
            node.style.maxHeight = height;
            setTimeout(function () {
                node.classList.remove('height-enter');
                node.classList.remove('height-enter-active');
                node.style.maxHeight = null;
                callback();
              }, TRANSITION_DURATION);
          }, TICK);
        break;
      case 'width':
        var width = getComputedStyle(node).getPropertyValue('width');
        node.classList.add('width-enter');
        node.style.maxWidth = '0px';
        setTimeout(function () {
            node.classList.add('width-enter-active');
            node.style.maxWidth = width;
            setTimeout(function () {
                node.classList.remove('width-enter');
                node.classList.remove('width-enter-active');
                node.style.maxWidth = null;
                callback();
              }, TRANSITION_DURATION);
          }, TICK);
        break;
      default:
        node.classList.add(name + '-enter');
        setTimeout(function () {
            node.classList.add(name + '-enter-active');
            setTimeout(function () {
                node.classList.remove(name + '-enter');
                node.classList.remove(name + '-enter-active');
                callback();
              }, TRANSITION_DURATION);
          }, TICK);
    }
  },

  componentWillLeave: function (callback) {
    if (!this.props.transitionLeave) {
      callback();
      return;
    }
    var name = this.props.transitionName;
    var node = r.findDOMNode(this);
    switch (name) {
      case 'height':
        var height = getComputedStyle(node).getPropertyValue('height');
        node.classList.add('height-leave');
        node.style.maxHeight = height;
        setTimeout(function () {
            node.classList.add('height-leave-active');
            node.style.maxHeight = '0px';
            setTimeout(function () {
                node.classList.remove('height-leave');
                node.classList.remove('height-leave-active');
                node.style.maxHeight = null;
                callback();
              }, TRANSITION_DURATION);
          }, TICK);
        break;
      case 'width':
        var width = getComputedStyle(node).getPropertyValue('width');
        node.classList.add('width-leave');
        node.style.maxWidth = width;
        setTimeout(function () {
            node.classList.add('width-leave-active');
            node.style.maxWidth = '0px';
            setTimeout(function () {
                node.classList.remove('width-leave');
                node.classList.remove('width-leave-active');
                node.style.maxWidth = null;
                callback();
              }, TRANSITION_DURATION);
          }, TICK);
        break;
      default:
        node.classList.add(name + '-leave');
        setTimeout(function () {
            node.classList.add(name + '-leave-active');
            setTimeout(function () {
                node.classList.remove(name + '-leave');
                node.classList.remove(name + '-leave-active');
                callback();
              }, TRANSITION_DURATION);
          }, TICK);
    }
  },

  render: function () {
    return r.childrenOnly(this.props.children);
  }
};

module.exports = r.makeClassFactory('GenericTransitionGroupChild', _);
