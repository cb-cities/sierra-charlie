'use strict';

var r = require('../common/react');
var a = require('../actions');

var blue   = '#3f96f0';
var orange = '#f0690f';

var _ = {
  propTypes: function () {
    return {
      edge:       r.propTypes.object.isRequired,
      isShadow:   r.propTypes.bool,
      isRejected: r.propTypes.bool,
      isAccepted: r.propTypes.bool,
      isClipped:  r.propTypes.bool,
      isSelected: r.propTypes.bool
    };
  },

  render: function () {
    var stroke = (
      (this.props.isShadow ? '#fff' :
        (this.props.isRejected ? '#ccc' :
          (this.props.isAccepted ? '#999' :
            (this.props.isClipped ? '#333' :
              (this.props.isSelected ? orange : '#ccc'))))));
    var strokeWidth = (
      (this.props.isShadow ? 4 : 1));
    return (
      r.line({
          x1:          this.props.edge.p1.x,
          y1:          this.props.edge.p1.y,
          x2:          this.props.edge.p2.x,
          y2:          this.props.edge.p2.y,
          stroke:      stroke,
          strokeWidth: strokeWidth,
          onClick:     function (event) {
            event.stopPropagation();
            a.selectEdge(this.props.edge.id);
          }.bind(this)
        }));
  }
};

module.exports = r.makeClassFactory('EdgeView', _);
