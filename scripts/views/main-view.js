'use strict';

var r = require('../common/react');
var clip = require('Clip').clip;
var seg = require('../common/segment');
var utils = require('../common/utils');

var a = require('../actions');
var cityStore = require('../stores/city-store');
var selectionStore = require('../stores/selection-store');
var edgeView = require('./edge-view');

var blue   = '#3f96f0';
var orange = '#f0690f';

var _ = {
  getInitialState: function () {
    return {
      bounds:          undefined,
      width:           undefined,
      height:          undefined,
      viewBox:         undefined,
      edges:           [],
      edgesById:       {},
      selectedEdgeId:  undefined,
      selectedEdge:    undefined,
      hasSelection:    false,
      selectionBounds: undefined,
      rejectedEdges:   [],
      acceptedEdges:   [],
      clippedEdges:    []
    };
  },

  componentDidMount: function () {
    cityStore.subscribe(this.onPublishCity);
    selectionStore.subscribe(this.onPublishSelection);
  },

  componentWillUnmount: function () {
    cityStore.unsubscribe(this.onPublishCity);
    selectionStore.unsubscribe(this.onPublishSelection);
  },

  onPublishCity: function () {
    var bounds    = cityStore.getBounds();
    var width     = bounds.p2.x - bounds.p1.x;
    var height    = bounds.p2.y - bounds.p1.y;
    var viewBox   = [bounds.p1.x, bounds.p1.y, width, height].join(' ');
    var edges     = cityStore.getEdges();
    var edgesById = cityStore.getEdgesById();
    this.setState({
        bounds:       bounds,
        width:        width,
        height:       height,
        viewBox:      viewBox,
        edges:        edges,
        edgesById:    edgesById
      });
    this.updateSelection();
  },

  onPublishSelection: function () {
    var selectedEdgeId = selectionStore.getSelectedEdge();
    this.setState({
        selectedEdgeId: selectedEdgeId
      });
    this.updateSelection();
  },

  updateSelection: function () {
    var selectedEdge    = this.state.edgesById[this.state.selectedEdgeId];
    var hasSelection    = !!selectedEdge;
    var selectionBounds = selectedEdge && seg.bound(selectedEdge, 0);
     // TODO: Unify representation
    var clippingBounds = (
      selectionBounds && {
          xleft:   selectionBounds.p1.x,
          ytop:    selectionBounds.p2.y,
          xright:  selectionBounds.p2.x,
          ybottom: selectionBounds.p1.y
        });
    var rejectedEdges = [];
    var acceptedEdges = [];
    var clippedEdges  = [];
    if (clippingBounds) {
      this.state.edges.forEach(function (edge) {
          if (edge !== selectedEdge) {
            var result = clip(clippingBounds)(edge);
            if (result.value0) {
              var clippedEdge = utils.assign(result.value0, {
                  id: edge.id
                });
              acceptedEdges.push(edge);
              clippedEdges.push(clippedEdge);
            } else {
              rejectedEdges.push(edge);
            }
          }
        }.bind(this));
    }
    this.setState({
        selectedEdge:    selectedEdge,
        hasSelection:    hasSelection,
        selectionBounds: selectionBounds,
        rejectedEdges:   rejectedEdges,
        acceptedEdges:   acceptedEdges,
        clippedEdges:    clippedEdges
      });
  },

  renderEdgeShadows: function () {
    return (
      this.state.edges.map(function (edge) {
          return (
            edgeView({
                key:      'es' + edge.id,
                edge:     edge,
                isShadow: true
              }));
        }));
  },

  renderEdges: function () {
    return (
      this.state.hasSelection ? null :
        this.state.edges.map(function (edge) {
            return (
              edgeView({
                  key:  'e' + edge.id,
                  edge: edge
                }));
          }));
  },

  renderRejectedEdges: function () {
    return (
      this.state.rejectedEdges.map(function (edge) {
          return (
            edgeView({
                key:        're' + edge.id,
                edge:       edge,
                isRejected: true
              }));
        }));
  },

  renderAcceptedEdges: function () {
    return (
      this.state.acceptedEdges.map(function (edge) {
          return (
            edgeView({
                key:        'ae' + edge.id,
                edge:       edge,
                isAccepted: true
              }));
        }));
  },

  renderClippedEdges: function () {
    return (
      this.state.clippedEdges.map(function (edge) {
          return (
            edgeView({
                key:       'ce' + edge.id,
                edge:      edge,
                isClipped: true
              }));
        }));
  },

  renderSelectedEdge: function () {
    return (
      !this.state.selectedEdge ? null :
        edgeView({
            key:        'se',
            edge:       this.state.selectedEdge,
            isSelected: true
          }));
  },

  renderSelectionBounds: function () {
    return (
      !this.state.selectionBounds ? null :
        r.rect({
            key:             'sb',
            x:               this.state.selectionBounds.p1.x,
            y:               this.state.selectionBounds.p1.y,
            width:           this.state.selectionBounds.p2.x - this.state.selectionBounds.p1.x,
            height:          this.state.selectionBounds.p2.y - this.state.selectionBounds.p1.y,
            fill:            'none',
            stroke:          orange,
            strokeWidth:     0.5,
            strokeDasharray: '2 1'
          }));
  },

  render: function () {
    return (
      r.div({
          className: 'main-view' + (this.state.hasSelection ? ' clickable' : ''),
          onClick:   this.state.hasSelection && function (event) {
            event.stopPropagation();
            a.deselect();
          }
        },
        r.svg({
            className: 'content',
            viewBox:   this.state.viewBox
          },
          this.renderEdgeShadows(),
          this.renderEdges(),
          this.renderRejectedEdges(),
          this.renderAcceptedEdges(),
          this.renderClippedEdges(),
          this.renderSelectedEdge(),
          this.renderSelectionBounds())));
  }
};

module.exports = r.makeClassFactory('MainView', _);
