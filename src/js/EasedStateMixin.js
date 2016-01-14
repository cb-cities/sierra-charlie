"use strict";

const easeTween = require("ease-tween");
const reactTweenState = require("react-tween-state");


module.exports = {
  mixins: [reactTweenState.Mixin],

  componentDidMount: function () {
    this.easingCounts = {};
  },

  setEasedState: function (stateKey, value, duration, easing, cb) {
    function forward(elapsed, from, to, duration) {
      return (to - from) * easeTween.ease(elapsed / duration) + from;
    }
    function reverse(elapsed, from, to, duration) {
      return (to - from) * (1 - easeTween.ease(1 - elapsed / duration)) + from;
    }
    if (!this.easingCounts[stateKey]) {
      this.easingCounts[stateKey] = 1;
    } else {
      this.easingCounts[stateKey]++;
    }
    this.tweenState(stateKey, {
        endValue: value,
        duration: duration,
        easing: !easing ? forward : easing === "reverse" ? reverse : easing,
        onEnd: function () {
          this.easingCounts[stateKey]--;
          if (cb && !this.easingCounts[stateKey]) {
            cb();
          }
        }.bind(this)
      });
  },

  getEasedState: function (stateKey) {
    return this.getTweeningValue(stateKey);
  }
};
