'use strict';

var utils = require('./utils');

var _htmlElements = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'big',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hr',
  'html',
  'i',
  'iframe',
  'img',
  'input',
  'ins',
  'kbd',
  'keygen',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'menu',
  'menuitem',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr'
];

var _svgElements = [
  'circle',
  'defs',
  'ellipse',
  'g',
  'line',
  'linearGradient',
  'mask',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'stop',
  'svg',
  'text',
  'tspan'
];

var _ = module.exports = {
  childrenOnly: window.React.Children.only,

  findDOMNode: window.React.findDOMNode,

  initializeTouchEvents: function () {
    window.React.initializeTouchEvents(true);
  },

  propTypes: window.React.PropTypes,

  render: window.React.render,

  makeClass: function (name, prototype) {
    return window.React.createClass(utils.assign(prototype, {
        displayName: name,
        mixins:      [window.React.addons.PureRenderMixin].concat(prototype.mixins)
      }));
  },

  makeFactory: function (element) {
    return function (thing) {
      var props = typeof thing !== 'string' ? thing : {
        className: thing
      };
      var args = [element, props];
      for (var i = 1; i < arguments.length; i += 1) {
        args.push(arguments[i]);
      }
      return window.React.createElement.apply(null, args);
    };
  },

  makeClassFactory: function (name, prototype) {
    var element = _.makeClass(name, prototype);
    return _.makeFactory(element);
  }
};

module.exports.transitionGroup    = _.makeFactory(window.React.addons.TransitionGroup);
module.exports.cssTransitionGroup = _.makeFactory(window.React.addons.CSSTransitionGroup);

_htmlElements.concat(_svgElements).forEach(function (element) {
    module.exports[element] = _.makeFactory(element);
  });
