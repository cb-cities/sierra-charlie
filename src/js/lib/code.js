"use strict";

const beautify = require("js-beautify").js_beautify;


module.exports = {
  quote: function (lambda) {
    return beautify(lambda.toString(), {
      indent_size: 2,
      space_after_anon_function: true,
      wrap_line_length: 42,
      wrap_attributes: "force"
    });
  },

  unquote: function (quoted) {
    return eval("(" + quoted + ")");
  }
};
