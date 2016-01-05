"use strict";

var AddressBookLoaderWorker = require("worker?inline!./AddressBookLoaderWorker");

var defs = require("./defs");


function AddressBook(props) {
  this.props = props;
  this.addresses = {};
  this.addressCount = 0;
  this.worker = new AddressBookLoaderWorker();
  this.worker.addEventListener("message", this.onMessage.bind(this));
  this.worker.postMessage({
      message: "startLoading",
      origin: window.location.origin
    });
}

AddressBook.prototype = {
  isLoadingFinished: function () {
    return this.addressCount === defs.maxAddressCount;
  },

  getRoadNodeAddress: function (roadNode) {
    if (roadNode.toid in this.addresses) {
      return this.addresses[roadNode.toid];
    } else {
      return null;
    }
  },

  onMessage: function (event) {
    switch (event.data.message) {
      case "addressesLoaded":
        this.onAddressesLoaded(event.data);
        break;
    }
    if (this.isLoadingFinished()) {
      this.worker.terminate();
    }
  },

  onAddressesLoaded: function (data) {
    for (var i = 0; i < data.addresses.length; i++) {
      var address = data.addresses[i];
      this.addresses[address.toid] = address;
    }
    this.addressCount += data.addresses.length;
    if (this.props.onAddressesLoaded) {
      this.props.onAddressesLoaded(data.addresses, this.addressCount);
    }
  }
}

module.exports = AddressBook;
