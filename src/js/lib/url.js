"use strict";

/* global unescape */


module.exports = {
  encodeJSONAsBlob: (object) => {
    const utf8 = JSON.stringify(object, null, 2);
    const blob = new Blob([utf8], {
      type: "application/json"
    });
    return URL.createObjectURL(blob);
  },

  encodeJSONAsData: (object) => {
    const utf8 = JSON.stringify(object, null, 2);
    const latin1 = unescape(encodeURIComponent(utf8));
    const base64 = btoa(latin1);
    return "data:application/json;charset=utf-8;base64," + base64;
  }
};
