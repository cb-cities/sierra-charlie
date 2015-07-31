'use strict';

var r = require('../common/react');
var vec = require('Vector');
var clip = require('Clip').clip;
var seg = require('../common/segment');
var utils = require('../common/utils');

var a = require('../actions');
var cityStore = require('../stores/city-store');
var selectionStore = require('../stores/selection-store');
var edgeView = require('./edge-view');

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
    var selectionBounds = selectedEdge && seg.bound(selectedEdge, 10);
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
                  edge: edge
                }));
          }));
  },

  renderRejectedEdges: function () {
    return (
      this.state.rejectedEdges.map(function (edge) {
          return (
            edgeView({
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
                edge:      edge,
                isClipped: true
              }));
        }));
  },

  renderSelectedEdge: function () {
    return (
      !this.state.selectedEdge ? null :
        edgeView({
            edge:       this.state.selectedEdge,
            isSelected: true
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
          this.renderSelectedEdge())));
  }
};

module.exports = r.makeClassFactory('MainView', _);
