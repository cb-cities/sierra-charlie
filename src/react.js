"use strict";

var r = require("react/addons");
var re = require("./react-elements");

var _ = module.exports = {
  childrenOnly: r.Children.only,

  domNode: r.findDOMNode,

  initTouch: function () {
    r.initializeTouchEvents(true);
  },

  propTypes: r.PropTypes,

  render: r.render,

  makeComponent: function (displayName, mod) {
    if (!mod.exports.displayName) {
      mod.exports.displayName = displayName;
    }
    if (!mod.exports.mixins) {
      mod.exports.mixins = [r.addons.PureRenderMixin];
    }
    var com = r.createClass(mod.exports);
    if (mod.makeHot) {
      com = mod.makeHot(com);
    }
    mod.exports = com;
  },

  wrap: function (com) {
    return function (thing) {
      var props;
      if (typeof thing === "object") {
        props = thing;
      } else if (typeof thing === "string") {
        props = {
          className: thing
        };
      } else {
        props = null;
      }
      var args = [com, props];
      for (var i = 1; i < arguments.length; i += 1) {
        args.push(arguments[i]);
      }
      return r.createElement.apply(null, args);
    };
  }
};

module.exports.transitionGroup = _.wrap(r.addons.TransitionGroup);

module.exports.cssTransitionGroup = _.wrap(r.addons.CSSTransitionGroup);

re.html.concat(re.svg).forEach(function (element) {
    module.exports[element] = _.wrap(element);
  });
