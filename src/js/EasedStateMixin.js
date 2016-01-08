"use strict";

const easeTween = require("ease-tween");
const reactTweenState = require("react-tween-state");


module.exports = {
  mixins: [reactTweenState.Mixin],

  componentDidMount: function () {
    this.easingCounts = {};
  },

  setEasedState: function (stateKey, value, duration, cb) {
    if (!this.easingCounts[stateKey]) {
      this.easingCounts[stateKey] = 1;
    } else {
      this.easingCounts[stateKey]++;
    }
    this.tweenState(stateKey, {
        endValue: value,
        duration: duration,
        easing: function (elapsed, from, to) {
          return from + (to - from) * easeTween.ease(elapsed / duration);
        },
        onEnd: function () {
          if (!--this.easingCounts[stateKey]) {
            cb();
          }
        }.bind(this)
      });
  },

  getEasedState: function (stateKey) {
    return this.getTweeningValue(stateKey);
  }
};
