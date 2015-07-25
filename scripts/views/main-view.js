'use strict';

var r = require('../common/react');

var cityStore = require('../stores/city-store');

var _ = {
  getInitialState: function () {
    return {
      nodes:  []
    };
  },

  componentDidMount: function () {
    cityStore.subscribe(this.onPublish);
  },

  componentWillUnmount: function () {
    cityStore.unsubscribe(this.onPublish);
  },

  onPublish: function () {
    this.setState({
        nodes: cityStore.getNodes()
      });
  },

  render: function () {
    return (
      r.div('main-view',
        r.svg({
            className: 'content',
            width:     1000,
            height:    1000,
            viewBox:   '0 0 1000 1000'
          },
          this.state.nodes.map(function (node, nodeIx) {
              return (
                r.circle({
                    key:    'c' + nodeIx,
                    cx:     node.x,
                    cy:     node.y,
                    r:      4,
                    fill:   'none',
                    stroke: '#3f96f0'
                  }));
            }))));
  }
};

module.exports = r.makeClassFactory('MainView', _);
