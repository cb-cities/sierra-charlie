"use strict";

var AddressBookLoader = require("./AddressBookLoader");


var loader = new AddressBookLoader();

self.onmessage = function (event) {
  switch (event.data.message) {
    case "startLoading":
      for (var i = 1; i <= 2; i++) {
        loader.loadAddresses(event.data.origin, i);
      }
      break;
  }
};
