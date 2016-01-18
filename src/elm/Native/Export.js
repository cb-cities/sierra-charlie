"use strict";


Elm.Native.Export = {
  make: function (elm) {
    elm.Native = elm.Native || {};
    elm.Native.Export = elm.Native.Export || {};
    if (elm.Native.Export.values) {
      return elm.Native.Export.values;
    }

    const Task = Elm.Native.Task.make(elm);
    const Utils = Elm.Native.Utils.make(elm);

    return {
      viaBlobURL: (object) => {
        const string = JSON.stringify(object, null, 2);
        const blob = new Blob([string], {
          type: "application/json"
        });
        open(URL.createObjectURL(blob));
        return Task.succeed(Utils.Tuple0);
      }
    };
  }
};
