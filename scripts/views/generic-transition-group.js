'use strict';

var r = require('../common/react');
var utils = require('../common/utils');

var genericTransitionGroupChild = require('./generic-transition-group-child');

var _ = {
  propTypes: function () {
    return {
      transitionName:  r.propTypes.string.isRequired,
      transitionEnter: r.propTypes.bool,
      transitionLeave: r.propTypes.bool
    };
  },

  getDefaultProps: function () {
    return {
      transitionName:  'fade',
      transitionEnter: true,
      transitionLeave: true
    };
  },

  renderChild: function (child) {
    return (
      genericTransitionGroupChild({
          transitionName:  this.props.transitionName,
          transitionEnter: this.props.transitionEnter,
          transitionLeave: this.props.transitionLeave
        },
        child));
  },

  render: function () {
    return (
      r.transitionGroup(
        utils.assign({
            childFactory: this.renderChild
          },
          this.props)));
  }
};

module.exports = r.makeClassFactory('GenericTransitionGroup', _);
