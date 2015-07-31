'use strict';

var r = require('../common/react');
var vec = require('Vector');
var clip = require('Clip');
var seg = require('../common/segment');
var sorted2d = require('../common/sorted2d');

var a = require('../actions');
var cityStore = require('../stores/city-store');
var selectionStore = require('../stores/selection-store');

var blue   = '#3f96f0';
var orange = '#f0690f';

var _ = {
  getInitialState: function () {
    return {
      bounds:       undefined,
      nodes:        [],
      edges:        [],
      nodesById:    {},
      edgesById:    {},
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
    var bounds    = cityStore.getBounds();
    var nodes     = cityStore.getNodes();
    var edges     = cityStore.getEdges();
    var nodesById = cityStore.getNodesById();
    var edgesById = cityStore.getEdgesById();
    this.setState({
        bounds:       bounds,
        width:        bounds.q.x - bounds.p.x,
        height:       bounds.q.y - bounds.p.y,
        nodes:        nodes,
        edges:        edges,
        nodesById:    nodesById,
        edgesById:    edgesById,
        selectedNode: nodesById[this.state.selectedNodeId],
        selectedEdge: edgesById[this.state.selectedEdgeId]
      });
  },

  onPublishSelection: function () {
    var selectedNodeId = selectionStore.getSelectedNode();
    var selectedEdgeId = selectionStore.getSelectedEdge();
    this.setState({
        selectedNodeId: selectedNodeId,
        selectedEdgeId: selectedEdgeId,
        selectedNode:   this.state.nodesById[selectedNodeId],
        selectedEdge:   this.state.edgesById[selectedEdgeId]
      });
  },

  renderEdgeShadow: function (edge) {
    return (
      r.line({
          key:         'es' + edge.id,
          x1:          edge.p.x,
          y1:          edge.p.y,
          x2:          edge.q.x,
          y2:          edge.q.y,
          stroke:      '#fff',
          strokeWidth: edge.type === 'a-road' ? 10 : (edge.type === 'b-road' ? 6 : 4),
          onClick:     function (event) {
            event.stopPropagation();
            a.selectEdge(edge.id);
          }
        }));
  },

  renderEdge: function (edge, _edgeIx, _edges, renderSelected) {
    var isSelected = edge === this.state.selectedEdge;
    if (isSelected && !renderSelected) {
      return null;
    }
    return (
      r.line({
          key:             'e' + edge.id,
          x1:              edge.p.x,
          y1:              edge.p.y,
          x2:              edge.q.x,
          y2:              edge.q.y,
          stroke:          isSelected ? orange : '#ccc',
          strokeWidth:     edge.type === 'a-road' ? 4 : (edge.type === 'b-road' ? 2 : 1),
          strokeDasharray: edge.type === 'underground' ? '5 5' : null,
          onClick:     function (event) {
            event.stopPropagation();
            a.selectEdge(edge.id);
          }
        }));
  },

  renderNodeShadow: function (node) {
    return (
      r.circle({
          key:         'ns' + node.id,
          cx:          node.x,
          cy:          node.y,
          r:           5,
          fill:        '#fff',
          onClick:     function (event) {
            event.stopPropagation();
            a.selectNode(node.id);
          }
        }));
  },

  renderNode: function (node, _nodeIx, _nodes, renderSelected) {
    var isSelected = node === this.state.selectedNode;
    if (isSelected && !renderSelected) {
      return null;
    }
    var isRelated  = (
      this.state.selectedEdge && (
        node === this.state.selectedEdge.p ||
        node === this.state.selectedEdge.q));
    return (
      r.circle({
          key:         'n' + node.id,
          cx:          node.x,
          cy:          node.y,
          r:           2,
          fill:        '#fff',
          stroke:      isSelected ? orange : (isRelated ? '#666' : '#ccc'),
          strokeWidth: 2,
          onClick:     function (event) {
            event.stopPropagation();
            a.selectNode(node.id);
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

  renderBoundedNodeProjection: function (boundedNode, projectedNode) {
    return [
      r.line({
          key:             'bps' + boundedNode.id,
          x1:              boundedNode.x,
          y1:              boundedNode.y,
          x2:              projectedNode.x,
          y2:              projectedNode.y,
          stroke:          '#fff',
          strokeLinecap:   'round'
        }),
      r.line({
          key:             'bp' + boundedNode.id,
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

  renderBoundedNodeDistance: function (boundedNode, distance) {
    return [
      r.text({
          key:      'ns' + boundedNode.id,
          x:        boundedNode.x - 2,
          y:        boundedNode.y + 1,
          fontSize: 4,
          stroke:   '#fff'
        }, distance),
      r.text({
          key:      'nt' + boundedNode.id,
          x:        boundedNode.x - 2,
          y:        boundedNode.y + 1,
          fontSize: 4,
          fill:     blue
        }, distance)];
  },

  renderBoundedNode: function (boundedNode) {
    var projectedNode = (
      this.state.selectedNode ||
      seg.proj(boundedNode, this.state.selectedEdge));
    var distance = Math.ceil(vec.dist(boundedNode)(projectedNode));
    return [
      this.renderBoundedNodeProjection(boundedNode, projectedNode),
      this.renderBoundedNodeDistance(boundedNode, distance)];
  },

  renderSelectedEdgeInfo: function (bounds) {
    var type;
    switch (this.state.selectedEdge.type) {
      case 'underground':
        type = 'Underground';
        break;
      case 'a-road':
        type = 'A Road';
        break;
      case 'b-road':
        type = 'B Road';
        break;
      default:
        type = 'Road';
    }
    return [
      r.text({
          key:      'tis',
          x:        bounds.q.x + 5,
          y:        bounds.p.y + 10,
          fontSize: 10,
          stroke:   '#fff'
        },
        'E' + this.state.selectedEdge.id),
      r.text({
          key:      'tts',
          x:        bounds.q.x + 5,
          y:        bounds.p.y + 20,
          fontSize: 10,
          stroke:   '#fff'
        },
        type),
      r.text({
          key:      'ti',
          x:        bounds.q.x + 5,
          y:        bounds.p.y + 10,
          fontSize: 10,
          fill:     orange
        },
        'E' + this.state.selectedEdge.id),
      r.text({
          key:      'tt',
          x:        bounds.q.x + 5,
          y:        bounds.p.y + 20,
          fontSize: 10,
          fill:     orange
        },
        type)];
  },

  renderSelectedNodeInfo: function (bounds) {
    return [
      r.text({
          key:      'tis',
          x:        bounds.q.x + 5,
          y:        bounds.p.y + 10,
          fontSize: 10,
          stroke:   '#fff'
        },
        'N' + this.state.selectedNode.id),
      r.text({
          key:      'ti',
          x:        bounds.q.x + 5,
          y:        bounds.p.y + 10,
          fontSize: 10,
          fill:     orange
        },
        'N' + this.state.selectedNode.id)];
  },

  renderClippedEdge: function (edge, edgeIx) {
    return (
      r.line({
          key:    'ce' + edgeIx,
          x1:     edge.p1.x,
          y1:     edge.p1.y,
          x2:     edge.p2.x,
          y2:     edge.p2.y,
          stroke: '#666'
        }));
  },

  renderClippedNode: function (node, nodeIx) {
    return (
      r.circle({
          key:         'cn' + nodeIx,
          cx:          node.x,
          cy:          node.y,
          r:           2,
          fill:        '#fff',
          stroke:      '#666',
          strokeWidth: 2
        }));
  },

  render: function () {
    var viewBox = (
      this.state.bounds && [
        this.state.bounds.p.x,
        this.state.bounds.p.y,
        this.state.width,
        this.state.height].join(' '));
    var hasSelection = this.state.selectedNode || this.state.selectedEdge;
    var bounds = (
      (this.state.selectedNode &&
        vec.bound(this.state.selectedNode)(10)) ||
      (this.state.selectedEdge &&
        seg.bound(this.state.selectedEdge, 10)));
    var clipBounds = (
      bounds && {
          xleft:   bounds.p.x,
          ytop:    bounds.q.y,
          xright:  bounds.q.x,
          ybottom: bounds.p.y
        });
    var clipEdges = (
      bounds && this.state.edges.filter(function (edge) {
          return edge !== this.state.selectedEdge;
        }.bind(this)).map(function (edge) {
          return {
            p1: edge.p,
            p2: edge.q
          };
        }));
    var clippedEdges = (
      bounds && clip.clipAll(clipBounds)(clipEdges));
    var clippedNodes = (
      bounds && sorted2d.between(this.state.nodes, bounds.p, bounds.q));
    return (
      r.div({
          className: 'main-view' + (hasSelection ? ' clickable' : ''),
          onClick:   hasSelection && function (event) {
            event.stopPropagation();
            a.deselect();
          }
        },
        r.svg({
            className: 'content',
            width:     this.state.width,
            height:    this.state.height,
            viewBox:   viewBox
          },
          this.state.edges.map(this.renderEdgeShadow),
          this.state.nodes.map(this.renderNodeShadow),
          this.state.edges.map(this.renderEdge),
          !clippedEdges ? null :
            clippedEdges.map(this.renderClippedEdge),
          !this.state.selectedEdge ? null :
            this.renderEdge(this.state.selectedEdge, null, null, true),
          this.state.nodes.map(this.renderNode),
          !clippedNodes ? null :
            clippedNodes.map(this.renderClippedNode),
          !this.state.selectedNode ? null :
            this.renderNode(this.state.selectedNode, null, null, true),
          !bounds ? null :
            this.renderBounds(bounds))));
  }
};

module.exports = r.makeClassFactory('MainView', _);
