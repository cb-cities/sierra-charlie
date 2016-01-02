"use strict";

var easeTween = require("ease-tween");
var reactTweenState = require("react-tween-state");


module.exports = {
  mixins: [reactTweenState.Mixin],

  componentDidMount: function () {
    this.easeCounts = {};
  },

  easeState: function (stateKey, value, duration, cb) {
    if (!this.easeCounts[stateKey]) {
      this.easeCounts[stateKey] = 1;
    } else {
      this.easeCounts[stateKey]++;
    }
    this.tweenState(stateKey, {
        endValue: value,
        duration: duration,
        easing: function (elapsed, from, to) {
          return from + (to - from) * easeTween.ease(elapsed / duration);
        },
        onEnd: function () {
          if (!--this.easeCounts[stateKey]) {
            cb();
          }
        }.bind(this)
      });
  },

  getEasedState: function (stateKey) {
    return this.getTweeningValue(stateKey);
  }
};
