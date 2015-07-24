'use strict';

var r = require('../common/react');

var _ = {
  render: function () {
    return (
      r.div('browser',
        r.svg({
            className: 'content',
            width: 1000,
            height: 1000
          },
          r.circle({
              cx: 0,
              cy: 0,
              r: 1000,
              fill: '#3f96f0'
            }),
          r.circle({
              cx: 50,
              cy: 50,
              r: 25,
              fill: '#fff'
            }),
          r.circle({
              cx: 125,
              cy: 50,
              r: 25,
              fill: '#fff'
            }),
          r.circle({
              cx: 200,
              cy: 50,
              r: 25,
              fill: 'none',
              stroke: '#fff'
            }))));
  }
};

module.exports = r.makeClassFactory('Browser', _);
