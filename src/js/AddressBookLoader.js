"use strict";

var oboe = require("oboe");

var defs = require("./defs");


function AddressBookLoader() {
  this.addresses = [];
  this.prevPostDate = 0;
}

AddressBookLoader.prototype = {
  post: function (data, isForced) {
    if (isForced || this.addresses.length > 512 && this.prevPostDate + 100 < Date.now()) {
      this.prevPostDate = Date.now();
      postMessage(data);
      return true;
    }
    return false;
  },

  postAddresses: function (isForced) {
    var data = {
      message: "addressesLoaded",
      addresses: this.addresses
    };
    if (this.post(data, isForced)) {
      this.addresses = [];
    }
  },

  loadAddresses: function (origin, partIndex) {
    oboe(origin + "/json/addresses" + partIndex + ".json.gz")
      .node("!.*", function (obj, path) {
          var toid = path[0];
          this.addresses.push({
              toid: toid,
              lat: parseFloat(obj.lat),
              lng: parseFloat(obj.lng),
              addr: obj.addr
            });
          this.postAddresses();
          return oboe.drop;
        }.bind(this))
      .done(function () {
          this.postAddresses(true);
        }.bind(this));
  }
};

module.exports = AddressBookLoader;
