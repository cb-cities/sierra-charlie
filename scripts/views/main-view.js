'use strict';

var r = require('../common/react');
var sorted2d = require('../common/sorted2d');
var vec = require('../common/vector');
var seg = require('../common/segment');

var a = require('../actions');
var cityStore = require('../stores/city-store');
var selectionStore = require('../stores/selection-store');
var cityGen = require('../city-generator');

var blue   = '#3f96f0';
var orange = '#f0690f';

var _ = {
  getInitialState: function () {
    return {
      nodes:        [],
      edges:        [],
      selectedNode: undefined,
      selectedEdge: undefined
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
    var nodes = cityStore.getNodes();
    var edges = cityStore.getEdges();
    this.setState({
        nodes:        nodes,
        edges:        edges,
        selectedNode: nodes[this.state.selectedNodeIx],
        selectedEdge: edges[this.state.selectedEdgeIx]
      });
  },

  onPublishSelection: function () {
    var selectedNodeIx = selectionStore.getSelectedNode();
    var selectedEdgeIx = selectionStore.getSelectedEdge();
    this.setState({
        selectedNodeIx: selectedNodeIx,
        selectedEdgeIx: selectedEdgeIx,
        selectedNode:   this.state.nodes[selectedNodeIx],
        selectedEdge:   this.state.edges[selectedEdgeIx]
      });
  },

  renderEdgeShadow: function (edge, edgeIx) {
    return (
      r.line({
          key:         'es' + edgeIx,
          x1:          edge.p.x,
          y1:          edge.p.y,
          x2:          edge.q.x,
          y2:          edge.q.y,
          stroke:      '#fff',
          strokeWidth: 6,
          onClick:     function (event) {
            event.stopPropagation();
            a.selectEdge(edgeIx);
          }
        }));
  },

  renderEdge: function (edge, edgeIx) {
    var isSelected = edge === this.state.selectedEdge;
    return (
      r.line({
          key:         'e' + edgeIx,
          x1:          edge.p.x,
          y1:          edge.p.y,
          x2:          edge.q.x,
          y2:          edge.q.y,
          stroke:      isSelected ? orange : '#ccc',
          strokeWidth: 2,
          onClick:     function (event) {
            event.stopPropagation();
            a.selectEdge(edgeIx);
          }
        }));
  },

  renderNodeShadow: function (node, nodeIx) {
    return (
      r.circle({
          key:         'ns' + nodeIx,
          cx:          node.x,
          cy:          node.y,
          r:           5,
          fill:        '#fff',
          onClick:     function (event) {
            event.stopPropagation();
            a.selectNode(nodeIx);
          }
        }));
  },

  renderNode: function (node, nodeIx) {
    var isSelected = node === this.state.selectedNode;
    var isRelated  = (
      this.state.selectedEdge && (
        node === this.state.selectedEdge.p ||
        node === this.state.selectedEdge.q));
    return (
      r.circle({
          key:         'n' + nodeIx,
          cx:          node.x,
          cy:          node.y,
          r:           2,
          fill:        '#fff',
          stroke:      isSelected ? orange : (isRelated ? '#999' : '#ccc'),
          strokeWidth: 2,
          onClick:     function (event) {
            event.stopPropagation();
            a.selectNode(nodeIx);
          }
        }));
  },

  renderBounds: function (bounds) {
    return [
      r.rect({
          key:             'bs',
          x:               bounds.p.x,
          y:               bounds.p.y,
          width:           bounds.q.x - bounds.p.x,
          height:          bounds.q.y - bounds.p.y,
          fill:            'none',
          stroke:          '#fff'
        }),
      r.rect({
          key:             'b',
          x:               bounds.p.x,
          y:               bounds.p.y,
          width:           bounds.q.x - bounds.p.x,
          height:          bounds.q.y - bounds.p.y,
          fill:            'none',
          stroke:          orange,
          strokeWidth:     0.5,
          strokeDasharray: '2 1'
        })];
  },

  renderBoundedNodeProjection: function (boundedNode, boundedNodeIx, projectedNode) {
    return [
      r.line({
          key:             'bps' + boundedNodeIx,
          x1:              boundedNode.x,
          y1:              boundedNode.y,
          x2:              projectedNode.x,
          y2:              projectedNode.y,
          stroke:          '#fff',
          strokeLinecap:   'round'
        }),
      r.line({
          key:             'bp' + boundedNodeIx,
          x1:              boundedNode.x,
          y1:              boundedNode.y,
          x2:              projectedNode.x,
          y2:              projectedNode.y,
          stroke:          blue,
          strokeWidth:     0.5,
          strokeDasharray: '0.5 1',
          strokeLinecap:   'round'
        })];
  },

  renderBoundedNodeDistance: function (boundedNode, boundedNodeIx, distance) {
    return [
      r.text({
          key:      'ns' + boundedNodeIx,
          x:        boundedNode.x - 2,
          y:        boundedNode.y + 1,
          fontSize: 4,
          stroke:   '#fff'
        }, distance),
      r.text({
          key:      'nt' + boundedNodeIx,
          x:        boundedNode.x - 2,
          y:        boundedNode.y + 1,
          fontSize: 4,
          fill:     blue
        }, distance)];
  },

  renderBoundedNode: function (boundedNode, boundedNodeIx) {
    var projectedNode = (
      this.state.selectedNode ||
      seg.proj(boundedNode, this.state.selectedEdge));
    var distance = Math.ceil(vec.dist(boundedNode, projectedNode));
    return [
      this.renderBoundedNodeProjection(boundedNode, boundedNodeIx, projectedNode),
      this.renderBoundedNodeDistance(boundedNode, boundedNodeIx, distance)];
  },

  render: function () {
    var bounds = (
      (this.state.selectedNode &&
        vec.bound(this.state.selectedNode, cityGen.emptyArea)) ||
      (this.state.selectedEdge &&
        seg.bound(this.state.selectedEdge, cityGen.emptyArea)));
    var boundedNodes = (
      bounds &&
      sorted2d.between(this.state.nodes, bounds.p, bounds.q).filter(function (node) {
          return (
            (!this.state.selectedNode ||
              node !== this.state.selectedNode) &&
            (!this.state.selectedEdge || (
              node !== this.state.selectedEdge.p &&
              node !== this.state.selectedEdge.q)));
        }.bind(this)));
    return (
      r.div('main-view',
        r.svg({
            className: 'content',
            viewBox:   '0 0 1000 1000',
            onClick:   function (event) {
              event.stopPropagation();
              a.deselect();
            }
          },
          this.state.nodes.map(this.renderNodeShadow),
          this.state.edges.map(this.renderEdgeShadow),
          this.state.edges.map(this.renderEdge),
          this.state.nodes.map(this.renderNode),
          !bounds ? null :
            this.renderBounds(bounds),
          !boundedNodes ? null :
            boundedNodes.map(this.renderBoundedNode))));
  }
};

module.exports = r.makeClassFactory('MainView', _);
