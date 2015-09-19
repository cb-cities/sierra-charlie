"use strict";

var r = require("react-wrapper");
var seedRandomGen = require("seedrandom");

var randomUniform = seedRandomGen("", {
  state: true
});

var UNIFORMS_PER_NORMAL = 3;

function randomNormal() {
  var sum = 0;
  for (var i = 0; i < UNIFORMS_PER_NORMAL; i += 1) {
    sum += randomUniform();
  }
  var mean = sum / UNIFORMS_PER_NORMAL;
  return mean;
}

module.exports = {
  propTypes: function () {
    return {
      selectedTOID: r.propTypes.string,
      selectedLength: r.propTypes.number
    };
  },

  render: function () {
    return (
      r.div({
          className: "space-inspector user-select-none",
          style: {
            width: "440px",
            height: "168px",
            position: "absolute",
            left: "15px",
            top: "15px",
            border: "1px #ccc solid",
            background: "#fff",
            opacity: 0.85,
            boxSizing: "border-box",
            MozUserSelect: "none",
            MsUserSelect: "none",
            WebkitUserSelect: "none"
          }
        },
        r.p({},
          !this.props.selectedTOID ? "No selection" :
            "Selected: " + this.props.selectedTOID),
        !this.props.selectedLength ? null :
          r.p({},
            "Length: " + this.props.selectedLength)));
  }
};

r.makeComponent("SpaceInspector", module);
