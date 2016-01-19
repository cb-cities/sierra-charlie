"use strict";


window.makeNative(Elm, "Special", function (localRuntime) {
  var Task = Elm.Native.Task.make(localRuntime);
  var Utils = Elm.Native.Utils.make(localRuntime);

  return {
    send: function (message) {
      window.UI.receiveSpecial(message);
      return Task.succeed(Utils.Tuple0);
    }
  };
});
